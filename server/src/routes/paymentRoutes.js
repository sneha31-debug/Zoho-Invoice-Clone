const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), paymentController.create);
router.get('/', paymentController.findAll);
router.get('/:id', paymentController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), paymentController.update);

module.exports = router;
