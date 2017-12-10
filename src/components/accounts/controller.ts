import * as bunyan from 'bunyan';
import { Router, Response } from 'express';
import { Request } from '../../server';

import { asyncFn } from '../../application/middlewares';

import { AccountService } from './service';
import { IAccount } from '../model';

export class AccountController {
    private log: bunyan;
    private router: Router;
    private accountService: AccountService;

    constructor(log: bunyan) {
        this.log = log;
        this.router = Router();
        this.accountService = new AccountService();
    }

    public routes(): Router {
        this.router.get('/', asyncFn(this.get.bind(this)));
        this.router.post('/', asyncFn(this.update.bind(this)));
        return this.router;
    }

    private async get(req: Request, res: Response): Promise<Response> {
        this.log.info({ _id: req.user._id }, 'Fetching users account');

        const account: IAccount = await this.accountService.getById(req.user._id);
        return res.status(200).json(account);
    }

    private async update(req: Request, res: Response): Promise<Response> {
        this.log.info({ _id: req.user._id }, 'Updating users account');

        const account: IAccount = await this.accountService.update(req.user._id, req.body);
        return res.status(200).json(account);
    }
}
