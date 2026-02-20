const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', paymentController.create);
router.get('/', paymentController.findAll);
router.get('/:id', paymentController.findById);
router.put('/:id', paymentController.update);

module.exports = router;
