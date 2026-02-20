const { body } = require('express-validator');

const customerRules = [
    body('displayName').notEmpty().withMessage('Display name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString(),
    body('companyName').optional().isString(),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'SGD', 'AED']),
];

module.exports = { customerRules };
