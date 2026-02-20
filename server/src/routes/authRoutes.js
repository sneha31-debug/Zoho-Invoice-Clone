const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/v1/auth/register
router.post('/register', registerRules, validate, register);

// POST /api/v1/auth/login
router.post('/login', loginRules, validate, login);

// GET /api/v1/auth/me (protected)
router.get('/me', authMiddleware, getMe);

module.exports = router;

