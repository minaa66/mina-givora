import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

// Configure Cloudinary
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
    cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret
    });

    console.log('✅ Cloudinary configured successfully');
} else {
    console.log('⚠️  Cloudinary not configured - using local file storage');
}

export default cloudinary;
