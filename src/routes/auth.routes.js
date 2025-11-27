import express from 'express';
import {
    register,
    login,
    verifyEmail,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword,
    createToken,
    consumeToken,
    verifyToken,
    loginWithGoogle
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import {
    validateRegister,
    validateLogin,
    validatePasswordReset,
    validateNewPassword
} from '../utils/validators.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', validatePasswordReset, forgotPassword);
router.post('/reset-password', validateNewPassword, resetPassword);
router.post('/create-token', createToken);
router.post('/consume-token', consumeToken);
router.post('/verify-token', verifyToken);
router.post('/login-with-google', loginWithGoogle);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
