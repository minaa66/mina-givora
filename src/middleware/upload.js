import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { config } from '../config/env.js';
import path from 'path';
import fs from 'fs';

// Check if Cloudinary is configured
const isCloudinaryConfigured =
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret;

/**
 * Local Storage Configuration
 */
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = config.upload.uploadDir;

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

/**
 * Memory storage for Cloudinary uploads
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter to validate image types
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

/**
 * Multer upload configuration
 */
export const upload = multer({
    storage: isCloudinaryConfigured ? memoryStorage : localStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize
    }
});

/**
 * Upload to Cloudinary from buffer
 */
export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: config.cloudinary.folder,
                public_id: `product-${Date.now()}`,
                transformation: [{ width: 800, height: 800, crop: 'limit' }]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

/**
 * Delete image from Cloudinary
 */
export const deleteCloudinaryImage = async (publicId) => {
    if (!isCloudinaryConfigured || !publicId) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};

/**
 * Delete local image file
 */
export const deleteLocalImage = (filename) => {
    if (!filename) return;

    const filePath = path.join(config.upload.uploadDir, filename);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Deleted local image: ${filename}`);
        } catch (error) {
            console.error('Error deleting local image:', error);
        }
    }
};

/**
 * Get Cloudinary public ID from URL
 */
export const getCloudinaryPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
        return null;
    }

    try {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        return `${config.cloudinary.folder}/${publicId}`;
    } catch (error) {
        console.error('Error extracting Cloudinary public ID:', error);
        return null;
    }
};

/**
 * Get local filename from URL
 */
export const getLocalFilename = (url) => {
    if (!url || url.includes('cloudinary.com')) {
        return null;
    }

    try {
        const parts = url.split('/');
        return parts[parts.length - 1];
    } catch (error) {
        console.error('Error extracting local filename:', error);
        return null;
    }
};

export const isUsingCloudinary = () => isCloudinaryConfigured;
