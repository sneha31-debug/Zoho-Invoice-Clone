const express = require('express');
const router = express.Router();

router.get('/sales', (req, res) => {
    res.json({ success: true, message: 'Sales report — coming soon' });
});

router.get('/expenses', (req, res) => {
    res.json({ success: true, message: 'Expense report — coming soon' });
});

router.get('/aging', (req, res) => {
    res.json({ success: true, message: 'Aging report — coming soon' });
});

router.get('/tax', (req, res) => {
    res.json({ success: true, message: 'Tax report — coming soon' });
});

module.exports = router;
