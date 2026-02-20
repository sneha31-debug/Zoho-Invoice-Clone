const express = require('express');
const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', (req, res) => {
    res.json({ success: true, message: 'Register endpoint — coming soon' });
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
    res.json({ success: true, message: 'Login endpoint — coming soon' });
});

// GET /api/v1/auth/me
router.get('/me', (req, res) => {
    res.json({ success: true, message: 'Get current user — coming soon' });
});

module.exports = router;
