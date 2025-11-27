import express from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    uploadProductImages
} from '../controllers/products.controller.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validateProduct, validateId } from '../utils/validators.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', validateId, getProductById);

// Admin routes
router.post('/', authenticateAdmin, validateProduct, createProduct);
router.put('/:id', authenticateAdmin, validateId, updateProduct);
router.delete('/:id', authenticateAdmin, validateId, deleteProduct);
router.post('/upload-image', authenticateAdmin, upload.single('image'), uploadProductImage);
router.post('/upload-images', authenticateAdmin, upload.array('images', 5), uploadProductImages);

export default router;
