const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updateOrganization, getUsers, inviteUser, updateUser } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

// POST /api/v1/auth/register
router.post('/register', registerRules, validate, register);

// POST /api/v1/auth/login
router.post('/login', loginRules, validate, login);

// GET /api/v1/auth/me (protected)
router.get('/me', authMiddleware, getMe);

// PATCH /api/v1/auth/profile (protected)
router.patch('/profile', authMiddleware, authorize('ADMIN', 'MANAGER', 'STAFF'), updateProfile);

// PATCH /api/v1/auth/organization (protected)
router.patch('/organization', authMiddleware, authorize('ADMIN', 'MANAGER'), updateOrganization);

// User management
router.get('/users', authMiddleware, authorize('ADMIN', 'MANAGER'), getUsers);
router.post('/invite', authMiddleware, authorize('ADMIN', 'MANAGER'), inviteUser);
router.patch('/users/:id', authMiddleware, authorize('ADMIN', 'MANAGER'), updateUser);

module.exports = router;
