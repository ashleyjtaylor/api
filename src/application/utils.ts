import { sign } from 'jsonwebtoken';

/**
 * Generate token
 * @param data - Data to sign to a token
 * @param expiresIn  - When to expire token
 */
export const createToken = (data: any, expiresIn: string|number = '30 days') => {
    return sign(data, process.env.AUTH_TOKEN_SECRET, { expiresIn });
};
