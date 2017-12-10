import { Types } from 'mongoose';

import { Model, IAccount } from '../model';
import { CustomerService } from '../customers';
import { UnauthorizedError } from '../../application/errors';

export class AccountService {
    private exists(account: IAccount): void {
        if (!account) throw new UnauthorizedError('Account does not exist');
    }

    public async query(query: any, projections = {}, options = {}): Promise<IAccount> {
        const account: IAccount = await Model.findOne(query, projections, options);
        this.exists(account);
        return account;
    }

    public async getById(userId: Types.ObjectId): Promise<IAccount> {
        const account: IAccount = await Model.findOne({ _id: userId });
        this.exists(account);
        return account;
    }

    public async getByEmail(email: string): Promise<IAccount> {
        const account: IAccount = await Model.findOne({ email });
        this.exists(account);
        return account;
    }

    public async create(data: any, createCustomer = false): Promise<IAccount> {
        try {
            const account: IAccount = new Model(data);
            await account.validate();

            const { _id, name, email } = account;

            if (createCustomer) {
                const customer = await CustomerService.create({ _id, name, email });
                account.customerId = customer.id;
            }

            return await account.setPassword(data.password).save();
        } catch (err) {
            throw err;
        }
    }

    public async update(userId: Types.ObjectId, data: any): Promise<IAccount> {
        const query: any = { _id: userId };
        const options: any = { new: true, runValidators: true };
        const account: IAccount = await Model.findOneAndUpdate(query, data, options);
        this.exists(account);
        return account;
    }
}
