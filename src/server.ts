import * as Http from 'http';
import * as cors from 'cors';
import * as config from 'config';
import * as bunyan from 'bunyan';
import * as helmet from 'helmet';
import * as Express from 'express';
import * as Mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';

import { verifyToken } from './application/middlewares';
import { errorHandler, IErrorResponse, NotFoundError } from './application/errors';

import { AuthController } from './components/auth';
import { AccountController } from './components/accounts';

export interface Request extends Express.Request {
    user: any;
}

export class Server {
    private log: bunyan;
    private app: Express.Application;
    private server: Http.Server;
    private port: number;

    constructor(log: bunyan, port: number) {
        this.log = log.child({ module: 'Server' });
        this.app = Express();
        this.port = port;

        this.app.set('port', this.port);
        this.app.set('json spaces', 2);
        this.app.enable('trust proxy');
        this.app.disable('x-powered-by');

        this.app.use(helmet.hsts({ maxAge: 10886400, includeSubDomains: true, force: true }));
        this.app.use(compression());
        this.app.use(cors({ origin: '*' }));
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(methodOverride());

        this.app.locals = {...config.get<any>('app')};

        this.components();
        this.routes();

        this.server = Http.createServer(this.app);
    }

    private components(): void {
        this.app.use('/auth', new AuthController(this.log).routes());
        this.app.use('/accounts', verifyToken, new AccountController(this.log).routes());
    }

    private routes(): Express.Application {
        this.log.info('Connecting Routes');

        this.app.get('/status', (_req: Request, res: Express.Response) => {
            return res.status(200).send('ok');
        });

        this.app.get('/verify', verifyToken, (req: Request, res: Express.Response) => {
            return res.status(200).json(req.user);
        });

        this.app.use('*', (_req: Express.Request, _res: Express.Response, next: Express.NextFunction) => {
            return next(new NotFoundError());
        });

        this.app.use((err: any, req: Express.Request, res: Express.Response, _next: Express.NextFunction) => {
            const error: IErrorResponse = errorHandler(err);
            error.path = req.path;
            this.log.error({ err: err.name, message: err.message, method: req.method, path: req.path });
            return res.status(error.status).json(error);
        });

        return this.app;
    }

    public connect(uri: string): Server {
        const db = Mongoose;
        db.Promise = Promise;

        db.connect(uri, { useMongoClient: true }, err => {
            if (err) {
                this.log.error({ err }, 'Unable to connect to the database');
                process.exit(1);
            } else {
                this.log.info('✔ Database connected');
                this.start();
            }
        });

        return this;
    }

    public start(): Server {
        this.server
            .listen(this.port)
            .on('listening', () => this.log.info(`✔ Server running on port ${this.port}`))
            .on('close', () => this.log.info(`✔ Server closing on port ${this.port}`));

        return this;
    }

    public stop(): void {
        this.server.close(() => this.log.info(`✔ Server stopped ${this.port}`));
    }
}
