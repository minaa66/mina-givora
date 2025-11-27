import stripe from '../config/stripe.js';
import { config } from '../config/env.js';

/**
 * Create Stripe payment intent
 * POST /api/payment/create-intent
 */
export const createPaymentIntent = async (req, res, next) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: 'Payment processing is not configured'
            });
        }

        const { amount, currency = 'usd', metadata = {} } = req.body;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata: {
                userId: req.user.id,
                userEmail: req.user.email,
                ...metadata
            },
            automatic_payment_methods: {
                enabled: true
            }
        });

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            }
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        next(error);
    }
};

/**
 * Confirm payment
 * POST /api/payment/confirm
 */
export const confirmPayment = async (req, res, next) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: 'Payment processing is not configured'
            });
        }

        const { paymentIntentId } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        res.json({
            success: true,
            data: {
                status: paymentIntent.status,
                paymentIntent
            }
        });
    } catch (error) {
        console.error('Stripe payment confirmation error:', error);
        next(error);
    }
};

/**
 * Handle Stripe webhooks
 * POST /api/payment/webhook
 */
export const handleWebhook = async (req, res, next) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                success: false,
                message: 'Payment processing is not configured'
            });
        }

        const sig = req.headers['stripe-signature'];
        const webhookSecret = config.stripe.webhookSecret;

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('PaymentIntent succeeded:', paymentIntent.id);
                // Update order status in database
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log('PaymentIntent failed:', failedPayment.id);
                // Handle failed payment
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        next(error);
    }
};

/**
 * Get Stripe publishable key
 * GET /api/payment/config
 */
export const getStripeConfig = (req, res) => {
    res.json({
        success: true,
        data: {
            publishableKey: config.stripe.publishableKey
        }
    });
};
