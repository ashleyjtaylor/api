import 'mocha';
import { expect } from 'chai';

import { Model, IAccount } from '../../src/components/model';

import { log } from '../helpers';
import { AccountService } from '../../src/components/accounts/service';

describe('Integration: Accounts', () => {
    log.child({ module: 'Accounts' });

    let _id;

    const user: any = {
        email: 'peter@parker.com',
        password: 'password',
        firstname: 'Peter',
        lastname: 'Parker'
    };

    const service: AccountService = new AccountService();

    before(done => {
        Model.remove({}).then(done()).catch(err => done(err));
    });

    after(done => {
        Model.remove({}).then(done()).catch(err => done(err));
    });

    it('should create a new user account', async () => {
        const account: IAccount = await service.create(user);
        _id = account._id;
        expect(account._id).to.exist;
        expect(account.email).equal(user.email);
    });

    it('should fetch a user by _id', async () => {
        const account: IAccount = await service.getById(_id);
        expect(account._id).to.exist;
        expect(account.email).equal(user.email);
    });

    it('should fetch a user by email', async () => {
        const account: IAccount = await service.getByEmail(user.email);
        expect(account._id).to.exist;
        expect(account.email).equal(user.email);
    });

    it('should error trying to get an invalid account', async () => {
        try {
            await service.getByEmail('no-account@email.com');
        } catch (err) {
            expect(err).to.not.be.null;
        }
    });

    it('should be able to query a users account', async () => {
        const query: any = { email: user.email };
        const projections: any = { firstname: 1, lastname: 1 };

        const account: IAccount = await service.query(query, projections);
        expect(account.firstname).to.exist;
        expect(account.email).to.be.undefined;
    });

    it('should update the users account and return the updated data', async () => {
        const account: IAccount = await service.getByEmail(user.email);
        const query: any = { _id: account._id };
        const data: any = { firstname: 'Clark', lastname: 'Kent' };

        const result: IAccount = await service.update(query, data);
        expect(result.firstname).equal('Clark');
        expect(result.lastname).equal('Kent');
    });

    it('should not update with any invalid data', async () => {
        const account: IAccount = await service.getByEmail(user.email);
        const query: any = { _id: account._id };
        const data: any = { invalid: 123, fruit: ['apples', 'oranges'] };

        const result = await service.update(query, data);
        expect(result['fruit']).to.be.undefined;
    });
});
