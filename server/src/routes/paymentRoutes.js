const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, message: 'List payments — coming soon', data: [] });
});

router.get('/:id', (req, res) => {
    res.json({ success: true, message: 'Get payment — coming soon' });
});

router.post('/', (req, res) => {
    res.json({ success: true, message: 'Create payment — coming soon' });
});

router.put('/:id', (req, res) => {
    res.json({ success: true, message: 'Update payment — coming soon' });
});

module.exports = router;
