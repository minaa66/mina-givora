import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById
} from '../controllers/orders.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateOrder } from '../utils/validators.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

router.post('/', validateOrder, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
