import * as config from 'config';
import * as bunyan from 'bunyan';
import { Router, Response } from 'express';
import { Request } from '../../server';

import { asyncFn, verifyToken } from '../../application/middlewares';

import { IAccount } from '../model';
import { AuthService } from './service';
import { AccountService } from '../accounts';

export class AuthController {
    private log: bunyan;
    private router: Router;
    private authService: AuthService;
    private accountService: AccountService;

    constructor(log: bunyan) {
        this.log = log;
        this.router = Router();
        this.authService = new AuthService();
        this.accountService = new AccountService();
    }

    public routes(): Router {
        this.router.post('/login', asyncFn(this.login.bind(this)));
        this.router.post('/logout', verifyToken, asyncFn(this.logout.bind(this)));
        this.router.post('/register', asyncFn(this.register.bind(this)));
        this.router.post('/password/reset', asyncFn(this.passwordReset.bind(this)));
        this.router.post('/password/forgot', asyncFn(this.passwordForgot.bind(this)));
        this.router.post('/password/change', verifyToken, asyncFn(this.passwordChange.bind(this)));
        return this.router;
    }

    private response(res: Response, account: IAccount, status = 200): Response {
        const cookie: string = config.get<string>('app.cookies.auth');
        const domain: string = config.get<string>('server.host');
        return res.status(status).cookie(cookie, account.generateToken(), { httpOnly: true, domain }).json(account);
    }

    private logout(req: Request, res: Response): Response {
        this.log.info({ _id: req.user._id }, 'Logging out');
        return res.clearCookie(config.get<string>('app.cookies.auth')).status(200).json({ user: null, token: null });
    }

    private async register(req: Request, res: Response): Promise<Response> {
        this.log.info('Registering a new user');

        const account: IAccount = await this.accountService.create(req.body);
        return this.response(res, account, 201);
    }

    private async login(req: Request, res: Response): Promise<Response> {
        this.log.info('Logging in');

        const { email, password } = req.body;
        const account: IAccount = await this.authService.login(email, password);
        return this.response(res, account);
    }

    private async passwordForgot(req: Request, res: Response): Promise<Response> {
        this.log.info('Requesting password reset');

        const token: string = await this.authService.passwordForgot(req.body.email);
        return res.status(200).json(token);
    }

    private async passwordReset(req: Request, res: Response): Promise<Response> {
        this.log.info('Resetting password');

        const { email, password, confirmPassword } = req.body;
        const token: string = req.query.token || req.body.token;

        await this.authService.passwordReset(email, password, confirmPassword, token);
        return res.status(200).json({ message: 'Password Updated' });
    }

    private async passwordChange(req: Request, res: Response): Promise<Response> {
        this.log.info('Changing password');

        const { oldPassword, newPassword } = req.body;
        const account: IAccount = await this.authService.passwordChange(req.user._id, oldPassword, newPassword);
        return this.response(res, account);
    }
}
