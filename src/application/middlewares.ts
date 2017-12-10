import * as config from 'config';
import { Response, NextFunction } from 'express';
import { verify, JsonWebTokenError } from 'jsonwebtoken';

/**
 * Wrap routes with async responses
 * @param fn - The function rendering the route
 */
export const asyncFn = fn => {
    return async function (...args) {
        try { await fn(...args); }
        catch (err) { return args[2](err); }
    };
};

/**
 * Verify and decode token
 */
export const verifyToken = (req: any, _res: Response, next: NextFunction) => {
    const authorization: string = req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer' ? req.headers.authorization.split(' ')[1] : null;
    const cookie: string = req.cookies[config.get<string>('app.cookies.auth')];
    const query: string = req.query ? req.query.token : null;
    const header: string = <string>req.headers['x-access-token'];

    const token: string = authorization || cookie || query || header;

    if (!token) return next(new JsonWebTokenError('Authorization token not found'));

    verify(token, process.env.AUTH_TOKEN_SECRET, (err, decoded) => {
        if (err) return next(new JsonWebTokenError('Authorization token is invalid'));
        req.user = decoded;
        next();
    });
};
