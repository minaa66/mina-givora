import express from 'express';
import {
    applyForWholesale,
    getWholesaleStatus
} from '../controllers/wholesale.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateWholesaleApplication } from '../utils/validators.js';

const router = express.Router();

// All wholesale routes require authentication
router.use(authenticate);

router.post('/apply', validateWholesaleApplication, applyForWholesale);
router.get('/status', getWholesaleStatus);

export default router;
