const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpayController');
const authMiddleware = require('../middlewares/authMiddleware');

// Webhook endpoint (expects JSON but needs to be accessible without auth)
router.post('/webhook', razorpayController.handleWebhook);

// Protected routes
router.use(authMiddleware);
router.post('/create-order', razorpayController.createOrder);

module.exports = router;
