import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { config } from '../config/env.js';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/email.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { sendWelcomeEmail } from '../utils/email.js';

/**
 * Register new user
 * POST /api/auth/register
 */
// Generate a verification code and expiration time
const generateVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    return { verificationCode: code, verificationCodeExpiry: expiresAt };
};

export const register = async (req, res, next) => {
    try {
        const { email, password, accountType, firstName, lastName, phone, address } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);
        const { verificationCode, verificationCodeExpiry } = generateVerificationCode();

        // Create user
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                accountType,
                firstName: firstName || null,
                lastName: lastName || null,
                phone: phone || null,
                address: address || null,
                isVerified: false,
                verificationCode,
                verificationCodeExpiry,
                verificationEmailSentAt: new Date()
            },

            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                accountType: true,
                isVerified: true,
                createdAt: true
            }
        });
        // Send verification email
        await sendVerificationEmail(user, verificationCode);


        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        // Find user
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
                wholesaleApplication: true
            }
        });
        if (!user && normalizedEmail !== email) {
            user = await prisma.user.findUnique({
                where: { email },
                include: { wholesaleApplication: true }
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in.'
            });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            accountType: user.accountType
        });

        // Prepare user data
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            address: user.address,
            accountType: user.accountType,
            isVerified: user.isVerified,
            approved: user.approved,
            createdAt: user.createdAt
        };

        // Add wholesale details if applicable
        if (user.wholesaleApplication) {
            userData.wholesaleDetails = {
                approvalStatus: user.wholesaleApplication.approvalStatus,
                totalUnitsOrdered: user.wholesaleApplication.totalUnitsOrdered
            };
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userData
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */

export const verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const codeStr = String(code).trim();

        if (!codeStr || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing code or email'
            });
        }
        let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user && normalizedEmail !== email) {
            user = await prisma.user.findUnique({ where: { email } });
        }
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'User already verified'
            });
        }
        if (user.verificationCode !== codeStr) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }
        if (new Date() > user.verificationCodeExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Verification code expired'
            });
        }
        const updatedUser = await prisma.user.update({
            where: { email: user.email },
            data: { isVerified: true },
            select: {
                id: true,
                email: true,
                isVerified: true,
                createdAt: true
            }
        });
        await sendWelcomeEmail(user);
        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: { updatedUser }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
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
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone, address } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(phone !== undefined && { phone }),
                ...(address !== undefined && { address })
            },
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
                updatedAt: true
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });
        if (!user && normalizedEmail !== email) {
            user = await prisma.user.findUnique({ where: { email } });
        }

        if (!user) {
            // Don't reveal if email exists
            return res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Save token to database
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt
            }
        });

        // In production, send email with reset link
        console.log(`Password reset token for ${email}: ${resetToken}`);
        await sendPasswordResetEmail(user, resetToken);
        res.json({
            success: true,
            message: 'If the email exists, a password reset link has been sent.',
            ...(process.env.NODE_ENV === 'development' && { token: resetToken })
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        // Find valid token
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                token,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: true
            }
        });

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const passwordHash = await hashPassword(password);

        // Update user password
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash }
        });

        // Delete used token
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id }
        });

        res.json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin login
 * POST /api/admin/login
 */
export const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);
        // Check against admin accounts
        const admin = config.adminAccounts.find(
            acc => acc.email === email && acc.password === password
        );
        console.log(admin);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Generate admin token
        const token = generateToken({
            email: admin.email,
            role: 'admin'
        });

        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                token,
                admin: { email: admin.email }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a generic token
 * POST /api/auth/create-token
 */
export const createToken = async (req, res, next) => {
    try {
        const { userId, type = 'generic', expiresIn = 3600 } = req.body; // Default 1 hour

        const tokenString = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        const token = await prisma.token.create({
            data: {
                userId,
                token: tokenString,
                type,
                expiresAt
            }
        });

        res.status(201).json({
            success: true,
            data: { token }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Consume (use) a token
 * POST /api/auth/consume-token
 */
export const consumeToken = async (req, res, next) => {
    try {
        const { token } = req.body;

        const tokenRecord = await prisma.token.findUnique({
            where: { token }
        });

        if (!tokenRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (tokenRecord.expiresAt < new Date()) {
            await prisma.token.delete({ where: { id: tokenRecord.id } });
            return res.status(400).json({
                success: false,
                message: 'Token expired'
            });
        }

        // Token is valid, consume it (delete it)
        await prisma.token.delete({
            where: { id: tokenRecord.id }
        });

        res.json({
            success: true,
            message: 'Token consumed successfully',
            data: { userId: tokenRecord.userId, type: tokenRecord.type }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify a token without consuming it
 * POST /api/auth/verify-token
 */
export const verifyToken = async (req, res, next) => {
    try {
        const { token } = req.body;

        const tokenRecord = await prisma.token.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!tokenRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (tokenRecord.expiresAt < new Date()) {
            // Optional: cleanup expired token
            // await prisma.token.delete({ where: { id: tokenRecord.id } });
            return res.status(400).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                isValid: true,
                userId: tokenRecord.userId,
                type: tokenRecord.type,
                user: {
                    email: tokenRecord.user.email,
                    firstName: tokenRecord.user.firstName,
                    lastName: tokenRecord.user.lastName
                }
            }
        });

    } catch (error) {
        next(error);
    }
};



import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    'postmessage'
);

/**
 * Login with Google
 * POST /api/auth/login-with-google
 */
export const loginWithGoogle = async (req, res, next) => {
    try {
        const { code } = req.body; // Google Authorization Code

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Exchange code for tokens
        const { tokens } = await client.getToken(code);
        const idToken = tokens.id_token;

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: config.google.clientId,
        });
        const payload = ticket.getPayload();

        const { email, given_name: firstName, family_name: lastName, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email not found in Google token'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    passwordHash: 'GOOGLE_AUTH_NO_PASSWORD', // Placeholder
                    firstName: firstName || '',
                    lastName: lastName || '',
                    isVerified: true, // Google emails are verified
                    accountType: 'retail'
                }
            });
        }

        // Generate JWT
        const jwtToken = generateToken({
            userId: user.id,
            email: user.email,
            accountType: user.accountType
        });

        res.json({
            success: true,
            message: 'Google login successful',
            data: {
                token: jwtToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    accountType: user.accountType
                }
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid Google login attempt'
        });
    }
};
