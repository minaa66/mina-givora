import prisma from '../config/database.js';

/**
 * Submit wholesale application
 * POST /api/wholesale/apply
 */
export const applyForWholesale = async (req, res, next) => {
    try {
        const {
            businessName,
            einNumber,
            businessType,
            address,
            city,
            state,
            zip,
            phone
        } = req.body;

        // Check if user already has an application
        const existingApp = await prisma.wholesaleApplication.findUnique({
            where: { userId: req.user.id }
        });

        if (existingApp) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a wholesale application',
                data: { application: existingApp }
            });
        }

        // Create application
        const application = await prisma.wholesaleApplication.create({
            data: {
                userId: req.user.id,
                businessName,
                einNumber,
                businessType,
                address,
                city,
                state,
                zip,
                phone,
                approvalStatus: 'pending'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Wholesale application submitted successfully',
            data: { application }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's wholesale application status
 * GET /api/wholesale/status
 */
export const getWholesaleStatus = async (req, res, next) => {
    try {
        const application = await prisma.wholesaleApplication.findUnique({
            where: { userId: req.user.id }
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'No wholesale application found'
            });
        }

        res.json({
            success: true,
            data: { application }
        });
    } catch (error) {
        next(error);
    }
};
