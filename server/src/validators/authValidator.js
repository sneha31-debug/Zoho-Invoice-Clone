const { body } = require('express-validator');

const registerRules = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('organizationName').optional().isString(),
];

const loginRules = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
