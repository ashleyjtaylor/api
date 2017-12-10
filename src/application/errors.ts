export interface IErrorResponse {
    name: string;
    path?: string;
    items?: any[];
    status: number;
    message: string;
}

export const errorHandler = (err: any): IErrorResponse => {
    let error: any = err;

    switch (err.name) {
        case 'JsonWebTokenError':
            error = new UnauthorizedError(err.message);
            break;
        case 'ValidationError':
            error = new BadRequestError(undefined, err.errors);
        default:
    }

    let response: IErrorResponse = {
        status: error.status || 400,
        name: error.name || 'BadRequestError',
        message: error.message || 'You have made an invalid request'
    };

    if (error.items) response.items = error.items;

    return response;
};

class BaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends BaseError {
    protected status: number = 400;
    protected items: any[];

    constructor(message = 'You have made an invalid request', data = undefined) {
        super(message);

        if (data) {
            this.items = [];

            Object.keys(data).forEach(key =>
                this.items.push({
                    key: key,
                    message: data[key].message
                })
            );
        }

        Error.captureStackTrace(this, this.constructor);
    }
}

export class UnauthorizedError extends BaseError {
    protected status: number = 401;

    constructor(message = 'You need to be authenticated to use this resource') {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends BaseError {
    protected status: number = 404;

    constructor(message = 'The resource you are trying to access does not exist') {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}
