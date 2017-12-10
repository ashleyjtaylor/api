import * as request from 'supertest';
import * as config from 'config';

import { Server } from '../../src/server';

import { log, UnauthorizedResponse, NotFoundResponse } from '../helpers';

describe('Integration: Server', () => {
    describe('Connection to the Server', () => {
        log.child({ module: 'Server' });

        let server;

        before(() => {
            server = new Server(log, config.get('server.port')).connect(config.get('db.uri'));
        });

        after(done => {
            server.stop();
            done();
        });

        it('should return a 200 response', (done) => {
            request(server.app)
                .get('/status')
                .expect('Content-Type', /text/)
                .expect(200, 'ok', done);
        });

        it('should return Unauthorized trying to access the resource', (done) => {
            request(server.app)
                .get('/verify')
                .expect('Content-Type', /json/)
                .expect(401, UnauthorizedResponse, done);
        });

        it('should return Not Found trying to access the resource', (done) => {
            request(server.app)
                .get('/not-found')
                .expect('Content-Type', /json/)
                .expect(404, NotFoundResponse, done);
        });
    });
});
