const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', expenseController.create);
router.get('/', expenseController.findAll);
router.get('/:id', expenseController.findById);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.remove);

module.exports = router;
