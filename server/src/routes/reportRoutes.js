const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/sales', reportController.salesSummary);
router.get('/expenses', reportController.expenseSummary);
router.get('/aging', reportController.agingReport);
router.get('/tax', reportController.taxSummary);

module.exports = router;
