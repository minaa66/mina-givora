import express from 'express';
import { submitContactMessage } from '../controllers/contact.controller.js';
import { validateContactMessage } from '../utils/validators.js';

const router = express.Router();

router.post('/', validateContactMessage, submitContactMessage);

export default router;
