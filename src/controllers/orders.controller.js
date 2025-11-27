import prisma from '../config/database.js';

/**
 * Calculate discount rate based on user type and volume
 */
const getDiscountRate = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            wholesaleApplication: true
        }
    });

    if (user.accountType !== 'wholesale' || !user.approved) {
        return 0;
    }

    // Additional 10% discount for high volume (>10,000 units ordered)
    if (user.wholesaleApplication && user.wholesaleApplication.totalUnitsOrdered > 10000) {
        return 0.10;
    }

    return 0;
};

/**
 * Create order from cart
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
    try {
        const { shippingMethod, paymentMethod, stripePaymentId } = req.body;

        // Get user's cart
        const cartItems = await prisma.cartItem.findMany({
            where: { userId: req.user.id },
            include: { product: true }
        });

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Check stock availability for all items
        for (const item of cartItems) {
            if (item.product.stockQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.product.name}`
                });
            }
        }

        // Calculate totals
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const isWholesale = user.accountType === 'wholesale' && user.approved;
        const volumeDiscount = await getDiscountRate(req.user.id);

        let subtotal = 0;
        const orderItems = [];

        for (const item of cartItems) {
            let price = isWholesale ? item.product.wholesalePrice : item.product.retailPrice;

            // Apply volume discount if applicable
            if (volumeDiscount > 0) {
                price = price * (1 - volumeDiscount);
            }

            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: price,
                discountApplied: volumeDiscount
            });
        }

        const taxAmount = subtotal * 0.08; // 8% tax
        const shippingCost = 15.00; // Flat shipping
        const totalAmount = subtotal + taxAmount + shippingCost;

        // Create order in transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId: req.user.id,
                    subtotal,
                    taxAmount,
                    shippingCost,
                    totalAmount,
                    shippingMethod,
                    paymentMethod,
                    stripePaymentId,
                    status: 'pending',
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // Update product stock
            for (const item of cartItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // Update wholesale total units if applicable
            if (isWholesale) {
                const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                await tx.wholesaleApplication.update({
                    where: { userId: req.user.id },
                    data: {
                        totalUnitsOrdered: {
                            increment: totalUnits
                        }
                    }
                });
            }

            // Clear cart
            await tx.cartItem.deleteMany({
                where: { userId: req.user.id }
            });

            return newOrder;
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's order history
 * GET /api/orders
 */
export const getOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format product images
        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                product: {
                    ...item.product,
                    images: item.product.images ? JSON.parse(item.product.images) : []
                }
            }))
        }));

        res.json({
            success: true,
            data: { orders: formattedOrders }
        });
    } catch (error) {
        next(error);
    }
};


/**
 * Get single order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify ownership
        if (order.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        res.json({
            success: true,
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};
