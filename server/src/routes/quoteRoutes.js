const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, message: 'List quotes — coming soon', data: [] });
});

router.get('/:id', (req, res) => {
    res.json({ success: true, message: 'Get quote — coming soon' });
});

router.post('/', (req, res) => {
    res.json({ success: true, message: 'Create quote — coming soon' });
});

router.put('/:id', (req, res) => {
    res.json({ success: true, message: 'Update quote — coming soon' });
});

router.delete('/:id', (req, res) => {
    res.json({ success: true, message: 'Delete quote — coming soon' });
});

module.exports = router;
