import Stripe from 'stripe';
import { config } from './env.js';

// Initialize Stripe with secret key
const stripe = config.stripe.secretKey
    ? new Stripe(config.stripe.secretKey, {
        apiVersion: '2024-11-20.acacia'
    })
    : null;

if (stripe) {
    console.log('✅ Stripe configured successfully');
} else {
    console.log('⚠️  Stripe not configured - payment processing disabled');
}

export default stripe;
