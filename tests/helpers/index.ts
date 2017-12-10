import * as config from 'config';
import * as bunyan from 'bunyan';
import * as format from 'bunyan-format';

import { IErrorResponse } from '../../src/application/errors';

export const log: bunyan = bunyan.createLogger({
    name: 'Test',
    level: config.get('log.level'),
    stream: format({ outputMode: 'short', color: true }, process.stdout),
    serializers: bunyan.stdSerializers,
    src: true
});

export const NotFoundResponse: IErrorResponse = {
    status: 404,
    name: 'NotFoundError',
    message: 'The resource you are trying to access does not exist',
    path: '/not-found'
};

export const UnauthorizedResponse: IErrorResponse = {
    status: 401,
    name: 'UnauthorizedError',
    message: 'Authorization token not found',
    path: '/verify'
};
