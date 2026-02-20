const { body } = require('express-validator');

const invoiceRules = [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('dueDate').notEmpty().isISO8601().withMessage('Valid due date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one line item is required'),
    body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
    body('items.*.rate').isFloat({ min: 0 }).withMessage('Rate must be 0 or greater'),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'SGD', 'AED']),
    body('discountAmount').optional().isFloat({ min: 0 }),
];

module.exports = { invoiceRules };
