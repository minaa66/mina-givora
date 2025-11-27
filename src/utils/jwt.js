import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generate JWT token
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        return null;
    }
};

/**
 * Decode JWT token without verification
 */
export const decodeToken = (token) => {
    return jwt.decode(token);
};
