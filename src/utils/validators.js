import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * User Registration Validation
 */
export const validateRegister = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    body('accountType')
        .isIn(['retail', 'wholesale'])
        .withMessage('Account type must be either retail or wholesale'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('First name cannot be empty'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Last name cannot be empty'),
    validate
];

/**
 * Login Validation
 */
export const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate
];

/**
 * Product Creation/Update Validation
 */
export const validateProduct = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required'),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required'),
    body('sku')
        .trim()
        .notEmpty()
        .withMessage('SKU is required'),
    body('moq')
        .isInt({ min: 1 })
        .withMessage('MOQ must be a positive integer'),
    body('retailPrice')
        .isFloat({ min: 0 })
        .withMessage('Retail price must be a positive number'),
    body('wholesalePrice')
        .isFloat({ min: 0 })
        .withMessage('Wholesale price must be a positive number'),
    body('stockQuantity')
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    // Optional images array validation (3 to 5 items)
    body('images')
        .optional()
        .custom((val) => {
            const arr = typeof val === 'string' ? (() => { try { return JSON.parse(val); } catch { return null; } })() : val;
            if (!Array.isArray(arr)) {
                throw new Error('Images must be an array');
            }
            if (arr.length < 3 || arr.length > 5) {
                throw new Error('Images array must contain between 3 and 5 images');
            }
            for (const img of arr) {
                if (!img || typeof img !== 'object') throw new Error('Each image must be an object');
                if (!img.imageUrl || typeof img.imageUrl !== 'string') throw new Error('Each image must have imageUrl');
                if (img.cloudinaryId !== undefined && img.cloudinaryId !== null && typeof img.cloudinaryId !== 'string') {
                    throw new Error('cloudinaryId must be a string or null');
                }
            }
            return true;
        }),
    validate
];

/**
 * Cart Item Validation
 */
export const validateCartItem = [
    body('productId')
        .isInt()
        .withMessage('Product ID must be an integer'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    validate
];

/**
 * Order Creation Validation
 */
export const validateOrder = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('shippingMethod')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Shipping method cannot be empty'),
    body('paymentMethod')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Payment method cannot be empty'),
    validate
];

/**
 * Wholesale Application Validation
 */
export const validateWholesaleApplication = [
    body('businessName')
        .trim()
        .notEmpty()
        .withMessage('Business name is required'),
    body('einNumber')
        .trim()
        .notEmpty()
        .withMessage('EIN number is required'),
    body('businessType')
        .trim()
        .notEmpty()
        .withMessage('Business type is required'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    body('zip')
        .trim()
        .notEmpty()
        .withMessage('ZIP code is required'),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required'),
    validate
];

/**
 * Contact Message Validation
 */
export const validateContactMessage = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('subject')
        .trim()
        .notEmpty()
        .withMessage('Subject is required'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required'),
    validate
];

/**
 * Password Reset Validation
 */
export const validatePasswordReset = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    validate
];

/**
 * New Password Validation
 */
export const validateNewPassword = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    validate
];

/**
 * ID Parameter Validation
 */
export const validateId = [
    param('id')
        .notEmpty()
        .withMessage('ID is required'),
    validate
];
