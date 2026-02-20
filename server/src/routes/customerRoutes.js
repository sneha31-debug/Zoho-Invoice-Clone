const express = require('express');
const router = express.Router();

// GET /api/v1/customers
router.get('/', (req, res) => {
    res.json({ success: true, message: 'List customers — coming soon', data: [] });
});

// GET /api/v1/customers/:id
router.get('/:id', (req, res) => {
    res.json({ success: true, message: 'Get customer — coming soon' });
});

// POST /api/v1/customers
router.post('/', (req, res) => {
    res.json({ success: true, message: 'Create customer — coming soon' });
});

// PUT /api/v1/customers/:id
router.put('/:id', (req, res) => {
    res.json({ success: true, message: 'Update customer — coming soon' });
});

// DELETE /api/v1/customers/:id
router.delete('/:id', (req, res) => {
    res.json({ success: true, message: 'Delete customer — coming soon' });
});

module.exports = router;
