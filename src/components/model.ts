import * as crypto from 'crypto';
import * as unique from 'mongoose-unique-validator';
import * as validate from 'mongoose-validator';
import * as Mongoose from 'mongoose';

import { createToken } from '../application/utils';

export interface IAccount extends Mongoose.Document {
    customerId: string;
    email: string;
    firstname: string;
    lastname: string;
    resource: string;
    cards: string[];
    subscriptions: string[];
    roles: string[];
    name: string;
    resetPasswordToken: string | undefined;
    resetPasswordExpiry: number | undefined;
    generateToken();
    validatePassword(password: string);
    setPassword(password: string);
}

const Schema: Mongoose.Schema = new Mongoose.Schema({
    firstname: {
        type: String,
        trim: true,
        required: [true, 'Missing Firstname'],
        validate: [validate({ validator: 'isAlpha', message: 'Invalid Firstname' })]
    },
    lastname: {
        type: String,
        trim: true,
        required: [true, 'Missing Lastname'],
        validate: [validate({ validator: 'isAlpha', message: 'Invalid Lastname' })]
    },
    email: {
        type: String,
        lowercase: true,
        index: true,
        unique: true,
        trim: true,
        uniqueCaseInsensitive: true,
        required: [true, 'Missing Email Address'],
        validate: [validate({ validator: 'isEmail', message: 'Invalid Email Address' })]
    },
    customerId: String,
    cards: { type: Array, default: [] },
    subscriptions: { type: Array, default: [] },
    resource: String,
    roles: { type: Array, default: ['user'] },
    hash: String,
    salt: String,
    resetPasswordToken: String,
    resetPasswordExpiry: Number
}, {
    strict: true,
    timestamps: true
});

Schema.virtual('name').get(function () {
    return `${this.firstname} ${this.lastname}`;
});

Schema.method('validatePassword', function (password) {
    return this.hash === crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
});

Schema.method('setPassword', function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
    return this;
});

Schema.method('generateToken', function () {
    return createToken({
        _id: this._id,
        name: this.name,
        email: this.email,
        customerId: this.customerId
    });
});

Schema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
        delete ret.__v;
        delete ret.id;
        delete ret.salt;
        delete ret.hash;
        return ret;
    }
});

Schema.plugin(unique, { message: '{PATH}: {VALUE}, already exists' });

export { Schema };
export const Model = Mongoose.model<IAccount>('Account', Schema, 'accounts');
