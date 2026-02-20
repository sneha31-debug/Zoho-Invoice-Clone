const express = require('express');
const router = express.Router();

// GET /api/v1/invoices
router.get('/', (req, res) => {
    res.json({ success: true, message: 'List invoices — coming soon', data: [] });
});

// GET /api/v1/invoices/:id
router.get('/:id', (req, res) => {
    res.json({ success: true, message: 'Get invoice — coming soon' });
});

// POST /api/v1/invoices
router.post('/', (req, res) => {
    res.json({ success: true, message: 'Create invoice — coming soon' });
});

// PUT /api/v1/invoices/:id
router.put('/:id', (req, res) => {
    res.json({ success: true, message: 'Update invoice — coming soon' });
});

// DELETE /api/v1/invoices/:id
router.delete('/:id', (req, res) => {
    res.json({ success: true, message: 'Delete invoice — coming soon' });
});

module.exports = router;
