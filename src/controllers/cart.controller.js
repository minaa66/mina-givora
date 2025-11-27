import prisma from '../config/database.js';

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = async (req, res, next) => {
    try {
        const cartItems = await prisma.cartItem.findMany({
            where: { userId: req.user.id },
            include: {
                product: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { cartItems }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add item to cart
 * POST /api/cart
 */
export const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;

        // Check if product exists and has enough stock
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stockQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock available'
            });
        }

        // Check if item already in cart
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                userId_productId: {
                    userId: req.user.id,
                    productId: parseInt(productId)
                }
            }
        });

        let cartItem;

        if (existingItem) {
            // Update quantity
            cartItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity
                },
                include: {
                    product: true
                }
            });
        } else {
            // Create new cart item
            cartItem = await prisma.cartItem.create({
                data: {
                    userId: req.user.id,
                    productId: parseInt(productId),
                    quantity
                },
                include: {
                    product: true
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            data: { cartItem }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update cart item quantity
 * PUT /api/cart/:itemId
 */
export const updateCartItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        // Get cart item
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { product: true }
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Verify ownership
        if (cartItem.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Check MOQ
        if (quantity < cartItem.product.moq) {
            return res.status(400).json({
                success: false,
                message: `Minimum order quantity is ${cartItem.product.moq} units`
            });
        }

        // Check stock
        if (cartItem.product.stockQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock available'
            });
        }

        // Update quantity
        const updatedItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
            include: { product: true }
        });

        res.json({
            success: true,
            message: 'Cart updated',
            data: { cartItem: updatedItem }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove item from cart
 * DELETE /api/cart/:itemId
 */
export const removeFromCart = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        // Get cart item
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId }
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Verify ownership
        if (cartItem.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Delete item
        await prisma.cartItem.delete({
            where: { id: itemId }
        });

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear entire cart
 * DELETE /api/cart
 */
export const clearCart = async (req, res, next) => {
    try {
        await prisma.cartItem.deleteMany({
            where: { userId: req.user.id }
        });

        res.json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        next(error);
    }
};
