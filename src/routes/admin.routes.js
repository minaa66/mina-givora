import express from 'express';
import { adminLogin } from '../controllers/auth.controller.js';
import {
    getDashboardStats,
    getWholesaleApplications,
    approveWholesaleApplication,
    rejectWholesaleApplication,
    getContactMessages,
    markMessageAsRead,
    deleteContactMessage,
    getAllOrders,
    updateOrderStatus,
    getAllUsers
} from '../controllers/admin.controller.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateLogin } from '../utils/validators.js';

const router = express.Router();

// Admin login (public)
router.post('/login', validateLogin, adminLogin);

// All other admin routes require authentication
router.use(authenticateAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Wholesale management
router.get('/wholesale/applications', getWholesaleApplications);
router.put('/wholesale/:id/approve', approveWholesaleApplication);
router.put('/wholesale/:id/reject', rejectWholesaleApplication);

// Contact messages
router.get('/messages', getContactMessages);
router.put('/messages/:id/read', markMessageAsRead);
router.delete('/messages/:id', deleteContactMessage);

// Orders management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Users management
router.get('/users', getAllUsers);

export default router;
