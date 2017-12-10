import { Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { IAccount } from '../model';
import { AccountService } from '../accounts';
import { BadRequestError } from '../../application/errors';

export class AuthService {
    private accountService: AccountService;

    constructor() {
        this.accountService = new AccountService();
    }

    private async queryResetToken(email: string, token: string): Promise<IAccount> {
        return await this.accountService.query({ email, resetPasswordToken: token, resetPasswordExpiry: { $gt: Date.now() } });
     }

    public validatePassword(account: IAccount, password: string): void {
        if (account && !account.validatePassword(password)) throw new BadRequestError('Incorrect Password');
    }

    public async login(email: string, password: string): Promise<IAccount> {
        const account: IAccount = await this.accountService.getByEmail(email);
        this.validatePassword(account, password);

        return account;
    }

    /**
     * TODO: Send token to email address
     */
    public async passwordForgot(email: string): Promise<string> {
        const account: IAccount = await this.accountService.getByEmail(email);
        const token: string = randomBytes(20).toString('hex');

        account.resetPasswordToken = token;
        account.resetPasswordExpiry = Date.now() + 300000;

        await account.validate();
        await account.save();

        return token;
    }

    public async passwordReset(email: string, password: string, confirmPassword: string, token: string): Promise<IAccount> {
        if (password !== confirmPassword) throw new BadRequestError('Passwords do not match');

        const account: IAccount = await this.queryResetToken(email, token);

        account.resetPasswordToken = undefined;
        account.resetPasswordExpiry = undefined;

        return await account.setPassword(password).save();
    }

    public async passwordChange(userId: Types.ObjectId, oldPassword: string, newPassword: string): Promise<IAccount> {
        const account: IAccount = await this.accountService.getById(userId);

        this.validatePassword(account, oldPassword);

        return await account.setPassword(newPassword).save();
    }
}
