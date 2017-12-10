import 'mocha';
import { expect } from 'chai';

import { errorHandler, BadRequestError, NotFoundError, UnauthorizedError, IErrorResponse } from '../../src/application/errors';

class TestError extends Error {
    public data: any;

    constructor(message: string, data = undefined) {
        super(message);
        this.name = this.constructor.name;
        this.data = data;
    }
}

describe('Unit: Error Handling', () => {
    let err: IErrorResponse;

    describe('BadRequestError', () => {
        it('should have correct response', (done) => {
            err = errorHandler(new BadRequestError());

            expect(err.status).eql(400);
            expect(err.name).eql('BadRequestError');

            err = errorHandler(new BadRequestError('custom message'));

            expect(err.status).eql(400);
            expect(err.message).eql('custom message');
            done();
        });

        it('should contain error data', (done) => {
            const data: any = { email: { message: 'Incorrect Email' }, password: { message: 'Incorrect Password' }};
            const response: any = [ { key: 'email', message: 'Incorrect Email' }, { key: 'password', message: 'Incorrect Password' } ];

            err = errorHandler(new BadRequestError(undefined, data));

            expect(err.status).eql(400);
            expect(err.name).eql('BadRequestError');
            expect(err.items).eql(response);
            done();
        });
    });

    describe('UnauthorizedError', () => {
        it('should have correct response', (done) => {
            err = errorHandler(new UnauthorizedError());

            expect(err.status).eql(401);
            expect(err.name).eql('UnauthorizedError');

            err = errorHandler(new UnauthorizedError('custom message'));

            expect(err.status).eql(401);
            expect(err.message).eql('custom message');
            done();
        });
    });

    describe('NotFoundError', () => {
        it('should have correct response', (done) => {
            err = errorHandler(new NotFoundError());

            expect(err.status).eql(404);
            expect(err.name).eql('NotFoundError');

            err = errorHandler(new NotFoundError('custom message'));

            expect(err.status).eql(404);
            expect(err.message).eql('custom message');
            done();
        });
    });

    describe('Unhandled Errors', () => {
        it('should return default values', (done) => {
            err = errorHandler(new TestError('test message'));

            expect(err.status).eql(400);
            expect(err.name).eql('TestError');
            done();
        });
    });
});
