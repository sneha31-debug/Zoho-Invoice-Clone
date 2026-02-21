const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), expenseController.create);
router.get('/', expenseController.findAll);
router.get('/:id', expenseController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), expenseController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), expenseController.remove);

module.exports = router;
