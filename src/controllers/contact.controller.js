import prisma from '../config/database.js';

/**
 * Submit contact message
 * POST /api/contact
 */
export const submitContactMessage = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        const contactMessage = await prisma.contactMessage.create({
            data: {
                name,
                email,
                subject,
                message,
                readStatus: false
            }
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully. We will get back to you soon.',
            data: { contactMessage }
        });
    } catch (error) {
        next(error);
    }
};
