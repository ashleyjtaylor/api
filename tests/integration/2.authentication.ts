require('dotenv').config();

import 'mocha';
import { expect } from 'chai';
import * as request from 'supertest';
import * as config from 'config';

import { Model } from '../../src/components/model';
import { Server } from '../../src/server';

import { log } from '../helpers';

describe('Integration: Authentication', () => {
    log.child({ module: 'Authentication' });

    let server;
    let token: string = null;

    const user: any = require('../fixtures/account.json');

    before(done => {
        Model.remove({}).then(() => {
            log.info('Removed all test data');
            server = new Server(log, config.get('server.port')).connect(config.get('db.uri'));
            done();
        }).catch(err => done(err));
    });

    after(done => {
        Model.remove({}).then(() => {
            server.stop();
            done();
        }).catch(err => done(err));
    });

    describe('Login Attempt - No Account', () => {
        it('should return no account message', (done) => {
            request(server.app)
                .post('/auth/login')
                .send({ email: user.email, password: user.password })
                .set('Accept', 'application/json')
                .expect(401, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.message).eql('Account does not exist');
                    done();
                });
        });
    });

    describe('Register', () => {
        it('should error when trying to register a new user with missing details', (done) => {
            request(server.app)
                .post('/auth/register')
                .send({ email: user.email, password: user.password, firstname: user.firstname })
                .set('Accept', 'application/json')
                .expect(400, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.items.length).to.eql(1);
                    expect(res.body.items[0]).to.eql({ key: 'lastname', message: 'Missing Lastname' });
                    done();
                });
        });

        it('should register a new user', (done) => {
            request(server.app)
                .post('/auth/register')
                .send(user)
                .set('Accept', 'application/json')
                .expect(201, (err, res) => {
                    token = res['headers']['set-cookie'][0].split('=')[1].split(';')[0];
                    expect(err).to.be.null;
                    expect(res['headers']['set-cookie'][0]).to.exist;
                    expect(res.body.hash).eql(undefined);
                    expect(res.body.name).eql(`${user.firstname} ${user.lastname}`);
                    expect(res.body.email).eql(user.email);
                    expect(res.body.customerId).eql(undefined);
                    expect(res.body.subscriptions).to.eql([]);
                    expect(res.body.roles[0]).eql('user');
                    done();
                });
        });

        it('should error when trying to register with the same email address', (done) => {
            request(server.app)
                .post('/auth/register')
                .send(user)
                .set('Accept', 'application/json')
                .expect(400, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.items.length).to.eql(1);
                    expect(res.body.items[0]).to.eql({ key: 'email', message: `email: ${user.email}, already exists` });
                    done();
                });
        });

        it('should be verified', (done) => {
            request(server.app)
                .get(`/verify?token=${token}`)
                .set('Accept', 'application/json')
                .expect(200, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.email).to.eql(user.email);
                    done();
                });
        });
    });

    describe('Logout', () => {
        it('should logout the user', (done) => {
            request(server.app)
                .post('/auth/logout')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .expect(200, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.token).to.be.null;
                    expect(res.body.user).to.be.null;
                    done();
                });
        });

        it('should NOT be verified', (done) => {
            token = null;
            request(server.app)
                .get(`/verify?token=`)
                .set('Accept', 'application/json')
                .expect(401, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.message).to.eql('Authorization token not found');
                    done();
                });
        });
    });

    describe('Login', () => {
        it('should error for incorrect password', (done) => {
            request(server.app)
                .post('/auth/login')
                .send({ email: user.email, password: 'wrong-password' })
                .set('Accept', 'application/json')
                .expect(400, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.message).eql('Incorrect Password');
                    done();
                });
        });

        it('should login a user', (done) => {
            request(server.app)
                .post('/auth/login')
                .send({ email: user.email, password: user.password })
                .set('Accept', 'application/json')
                .expect(200, (err, res) => {
                    token = res['headers']['set-cookie'][0].split('=')[1].split(';')[0];
                    expect(err).to.be.null;
                    expect(res.body.email).eql(user.email);
                    done();
                });
        });

        it('should be verified', (done) => {
            request(server.app)
                .get(`/verify?token=${token}`)
                .set('Accept', 'application/json')
                .expect(200, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.email).to.eql(user.email);
                    done();
                });
        });

        it('should logout the user', (done) => {
            request(server.app)
                .post('/auth/logout')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .expect(200, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.token).to.be.null;
                    expect(res.body.user).to.be.null;
                    expect(res.body.token).to.be.null;
                    done();
                });
        });
    });

    describe('Password Change', () => {
        it('should login a user', (done) => {
            request(server.app)
                .post('/auth/login')
                .send({ email: user.email, password: user.password })
                .set('Accept', 'application/json')
                .expect(200, (err, res) => {
                    token = res['headers']['set-cookie'][0].split('=')[1].split(';')[0];
                    expect(err).to.be.null;
                    expect(res.body.email).eql(user.email);
                    done();
                });
        });

        it('should be update the users password', (done) => {
            request(server.app)
                .post(`/auth/password/change`)
                .send({ oldPassword: user.password, newPassword: 'new-password' })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .expect(200, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.email).to.eql(user.email);
                    done();
                });
        });

        it('should logout the user', (done) => {
            request(server.app)
                .post('/auth/logout')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${token}`)
                .expect(200, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.token).to.be.null;
                    expect(res.body.user).to.be.null;
                    expect(res.body.token).to.be.null;
                    done();
                });
        });

        it('should error trying to log in with old password', (done) => {
            request(server.app)
                .post(`/auth/login`)
                .send({ email: user.email, password: user.password })
                .set('Accept', 'application/json')
                .expect(400, (err, res) => {
                    expect(err).to.be.null;
                    expect(res.body.message).eql('Incorrect Password');
                    done();
                });
        });
    });
});
