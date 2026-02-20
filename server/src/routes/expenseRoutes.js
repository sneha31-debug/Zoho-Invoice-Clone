const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, message: 'List expenses — coming soon', data: [] });
});

router.get('/:id', (req, res) => {
    res.json({ success: true, message: 'Get expense — coming soon' });
});

router.post('/', (req, res) => {
    res.json({ success: true, message: 'Create expense — coming soon' });
});

router.put('/:id', (req, res) => {
    res.json({ success: true, message: 'Update expense — coming soon' });
});

router.delete('/:id', (req, res) => {
    res.json({ success: true, message: 'Delete expense — coming soon' });
});

module.exports = router;
