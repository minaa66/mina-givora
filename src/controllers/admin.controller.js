import prisma from '../config/database.js';

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalProducts,
            totalOrders,
            pendingWholesale,
            unreadMessages,
            recentOrders
        ] = await Promise.all([
            prisma.user.count(),
            prisma.product.count(),
            prisma.order.count(),
            prisma.wholesaleApplication.count({
                where: { approvalStatus: 'pending' }
            }),
            prisma.contactMessage.count({
                where: { readStatus: false }
            }),
            prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalProducts,
                    totalOrders,
                    pendingWholesale,
                    unreadMessages
                },
                recentOrders
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all wholesale applications
 * GET /api/admin/wholesale/applications
 */
export const getWholesaleApplications = async (req, res, next) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status && status !== 'all') {
            where.approvalStatus = status;
        }

        const applications = await prisma.wholesaleApplication.findMany({
            where,
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { applications }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve wholesale application
 * PUT /api/admin/wholesale/:id/approve
 */
export const approveWholesaleApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        const application = await prisma.wholesaleApplication.findUnique({
            where: { id }
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update application and user in transaction
        await prisma.$transaction([
            prisma.wholesaleApplication.update({
                where: { id },
                data: { approvalStatus: 'approved' }
            }),
            prisma.user.update({
                where: { id: application.userId },
                data: {
                    accountType: 'wholesale',
                    approved: true
                }
            })
        ]);

        res.json({
            success: true,
            message: 'Wholesale application approved'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject wholesale application
 * PUT /api/admin/wholesale/:id/reject
 */
export const rejectWholesaleApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.wholesaleApplication.update({
            where: { id },
            data: { approvalStatus: 'rejected' }
        });

        res.json({
            success: true,
            message: 'Wholesale application rejected'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all contact messages
 * GET /api/admin/messages
 */
export const getContactMessages = async (req, res, next) => {
    try {
        const { read } = req.query;

        const where = {};
        if (read === 'true') {
            where.readStatus = true;
        } else if (read === 'false') {
            where.readStatus = false;
        }

        const messages = await prisma.contactMessage.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { messages }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark message as read
 * PUT /api/admin/messages/:id/read
 */
export const markMessageAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.contactMessage.update({
            where: { id },
            data: { readStatus: true }
        });

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete contact message
 * DELETE /api/admin/messages/:id
 */
export const deleteContactMessage = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.contactMessage.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Message deleted'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all orders (Admin)
 * GET /api/admin/orders
 */
export const getAllOrders = async (req, res, next) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status && status !== 'all') {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        accountType:true,
                        address:true,
                        approved:true,
                        isVerified:true,
                        createdAt:true,
                        
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { orders }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update order status
 * PUT /api/admin/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status }
        });

        res.json({
            success: true,
            message: 'Order status updated',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users (Admin)
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { accountType } = req.query;

        const where = {};
        if (accountType && accountType !== 'all') {
            where.accountType = accountType;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                accountType: true,
                isVerified: true,
                approved: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { users }
        });
    } catch (error) {
        next(error);
    }
};

