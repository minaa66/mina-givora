import prisma from '../config/database.js';
import { deleteCloudinaryImage, deleteLocalImage, getCloudinaryPublicId, getLocalFilename, isUsingCloudinary, uploadToCloudinary } from '../middleware/upload.js';

/**
 * Parse images JSON string to array
 */
const parseImages = (imagesStr) => {
    try {
        return imagesStr ? JSON.parse(imagesStr) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Format product with parsed images
 */
const formatProduct = (product) => {
    return {
        ...product,
        images: parseImages(product.images)
    };
};

/**
 * Get all products with optional filtering
 * GET /api/products
 */
export const getAllProducts = async (req, res, next) => {
    try {
        const { category, search } = req.query;

        const where = {};

        if (category && category !== 'all') {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { products: products.map(formatProduct) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: { product: formatProduct(product) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new product (Admin only)
 * POST /api/products
 */
export const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            category,
            description,
            sku,
            moq,
            retailPrice,
            wholesalePrice,
            stockQuantity,
            imageUrl,
            cloudinaryId,
            images
        } = req.body;

        // Parse images array (must be between 3 and 5 images)
        let parsedImages;
        try {
            parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid images payload. Must be a JSON array.' });
        }

        if (!Array.isArray(parsedImages) || parsedImages.length < 3 || parsedImages.length > 5) {
            return res.status(400).json({ success: false, message: 'Images array must contain between 3 and 5 images.' });
        }

        // Validate each image object
        for (const img of parsedImages) {
            if (!img || typeof img !== 'object' || typeof img.imageUrl !== 'string') {
                return res.status(400).json({ success: false, message: 'Each image must be an object with imageUrl.' });
            }
        }

        // Use first image as main image for backward compatibility
        const mainImage = parsedImages[0];

        const product = await prisma.product.create({
            data: {
                name,
                category,
                description,
                sku,
                moq: parseInt(moq),
                retailPrice: parseFloat(retailPrice),
                wholesalePrice: parseFloat(wholesalePrice),
                stockQuantity: parseInt(stockQuantity),
                imageUrl: mainImage?.imageUrl || imageUrl || null,
                cloudinaryId: mainImage?.cloudinaryId ?? cloudinaryId ?? null,
                images: JSON.stringify(parsedImages)
            }
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product: formatProduct(product) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update product (Admin only)
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name,
            category,
            description,
            sku,
            moq,
            retailPrice,
            wholesalePrice,
            stockQuantity,
            imageUrl,
            cloudinaryId,
            images
        } = req.body;

        // Get existing product to check for old image
        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // If image is being updated, delete old main image
        if (imageUrl && imageUrl !== existingProduct.imageUrl) {
            if (isUsingCloudinary() && existingProduct.cloudinaryId) {
                await deleteCloudinaryImage(existingProduct.cloudinaryId);
            } else if (existingProduct.imageUrl) {
                const filename = getLocalFilename(existingProduct.imageUrl);
                if (filename) {
                    deleteLocalImage(filename);
                }
            }
        }

        // Handle images array update if provided
        let parsedImages;
        if (images !== undefined) {
            try {
                parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid images payload. Must be a JSON array.' });
            }
            if (!Array.isArray(parsedImages) || parsedImages.length < 3 || parsedImages.length > 5) {
                return res.status(400).json({ success: false, message: 'Images array must contain between 3 and 5 images.' });
            }
            for (const img of parsedImages) {
                if (!img || typeof img !== 'object' || typeof img.imageUrl !== 'string') {
                    return res.status(400).json({ success: false, message: 'Each image must be an object with imageUrl.' });
                }
            }

            // Delete images that were removed
            let existingImages = [];
            try {
                existingImages = existingProduct.images ? JSON.parse(existingProduct.images) : [];
            } catch (e) {
                existingImages = [];
            }
            const newImageUrls = new Set(parsedImages.map(i => i.imageUrl));
            for (const oldImg of existingImages) {
                if (!newImageUrls.has(oldImg.imageUrl)) {
                    if (isUsingCloudinary() && oldImg.cloudinaryId) {
                        await deleteCloudinaryImage(oldImg.cloudinaryId);
                    } else if (oldImg.imageUrl) {
                        const filename = getLocalFilename(oldImg.imageUrl);
                        if (filename) deleteLocalImage(filename);
                    }
                }
            }
        }

        // Determine main image after potential images update
        const mainImage = parsedImages?.[0];

        // Update product
        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                ...(name !== undefined && { name }),
                ...(category !== undefined && { category }),
                ...(description !== undefined && { description }),
                ...(sku !== undefined && { sku }),
                ...(moq !== undefined && { moq: parseInt(moq) }),
                ...(retailPrice !== undefined && { retailPrice: parseFloat(retailPrice) }),
                ...(wholesalePrice !== undefined && { wholesalePrice: parseFloat(wholesalePrice) }),
                ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(cloudinaryId !== undefined && { cloudinaryId }),
                ...(parsedImages !== undefined && { images: JSON.stringify(parsedImages) }),
                ...(mainImage !== undefined && { imageUrl: mainImage?.imageUrl, cloudinaryId: mainImage?.cloudinaryId ?? null })
            }
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product: formatProduct(product) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete product (Admin only)
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get product to delete associated image
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete main image
        if (isUsingCloudinary() && product.cloudinaryId) {
            await deleteCloudinaryImage(product.cloudinaryId);
        } else if (product.imageUrl) {
            const filename = getLocalFilename(product.imageUrl);
            if (filename) {
                deleteLocalImage(filename);
            }
        }

        // Delete all images in the images array
        let imgs = [];
        try {
            imgs = product.images ? JSON.parse(product.images) : [];
        } catch (e) {
            imgs = [];
        }
        for (const img of imgs) {
            if (isUsingCloudinary() && img.cloudinaryId) {
                await deleteCloudinaryImage(img.cloudinaryId);
            } else if (img.imageUrl) {
                const filename = getLocalFilename(img.imageUrl);
                if (filename) deleteLocalImage(filename);
            }
        }

        // Delete related cart items first (cascade delete)
        await prisma.cartItem.deleteMany({
            where: { productId: parseInt(id) }
        });

        // Delete related order items (cascade delete)
        await prisma.orderItem.deleteMany({
            where: { productId: parseInt(id) }
        });

        // Delete product
        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload product image
 * POST /api/products/upload-image
 */
export const uploadProductImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        let imageData = {};

        if (isUsingCloudinary()) {
            // Upload to Cloudinary from buffer
            const result = await uploadToCloudinary(req.file.buffer);

            imageData = {
                imageUrl: result.secure_url,
                cloudinaryId: result.public_id
            };
        } else {
            // Local file upload
            const protocol = req.protocol;
            const host = req.get('host');
            imageData = {
                imageUrl: `${protocol}://${host}/uploads/products/${req.file.filename}`,
                cloudinaryId: null
            };
        }

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: imageData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload multiple product images
 * POST /api/products/upload-images
 */
export const uploadProductImages = async (req, res, next) => {
    try {
        if (!req.files || !req.files.length) {
            return res.status(400).json({ success: false, message: 'No image files provided' });
        }

        if (req.files.length < 3 || req.files.length > 5) {
            return res.status(400).json({ success: false, message: 'Please upload between 3 and 5 images' });
        }

        const uploaded = [];
        if (isUsingCloudinary()) {
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer);
                uploaded.push({ imageUrl: result.secure_url, cloudinaryId: result.public_id });
            }
        } else {
            const protocol = req.protocol;
            const host = req.get('host');
            for (const file of req.files) {
                uploaded.push({ imageUrl: `${protocol}://${host}/uploads/products/${file.filename}`, cloudinaryId: null });
            }
        }

        res.json({ success: true, message: 'Images uploaded successfully', data: { images: uploaded } });
    } catch (error) {
        next(error);
    }
};
