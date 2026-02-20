const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, message: 'List time entries — coming soon', data: [] });
});

router.get('/:id', (req, res) => {
    res.json({ success: true, message: 'Get time entry — coming soon' });
});

router.post('/', (req, res) => {
    res.json({ success: true, message: 'Create time entry — coming soon' });
});

router.put('/:id', (req, res) => {
    res.json({ success: true, message: 'Update time entry — coming soon' });
});

router.delete('/:id', (req, res) => {
    res.json({ success: true, message: 'Delete time entry — coming soon' });
});

module.exports = router;
