import express from 'express';
import {
    createPaymentIntent,
    confirmPayment,
    handleWebhook,
    getStripeConfig
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route for Stripe config
router.get('/config', getStripeConfig);

// Webhook route (must be before body parser middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/confirm', authenticate, confirmPayment);

export default router;
