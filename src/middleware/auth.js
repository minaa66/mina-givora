import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

/**
 * Middleware to authenticate user via JWT
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token. Please login again.'
            });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                accountType: true,
                isVerified: true,
                approved: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Middleware to check if user is verified
 */
export const requireVerified = (req, res, next) => {
    if (!req.user.isVerified) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email address first.'
        });
    }
    next();
};

/**
 * Middleware to check if user is wholesale and approved
 */
export const requireWholesale = (req, res, next) => {
    if (req.user.accountType !== 'wholesale' || !req.user.approved) {
        return res.status(403).json({
            success: false,
            message: 'This feature is only available for approved wholesale customers.'
        });
    }
    next();
};

/**
 * Middleware to authenticate admin
 */
export const authenticateAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Admin authentication required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        req.admin = { email: decoded.email };
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Admin authentication failed'
        });
    }
};
