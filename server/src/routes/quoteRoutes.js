const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), quoteController.create);
router.get('/', quoteController.findAll);
router.get('/:id', quoteController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), quoteController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), quoteController.remove);
router.post('/:id/convert', authorize('ADMIN', 'MANAGER', 'STAFF'), quoteController.convertToInvoice);

module.exports = router;
