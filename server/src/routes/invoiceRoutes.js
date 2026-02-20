const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { invoiceRules } = require('../validators/invoiceValidator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', invoiceRules, validate, invoiceController.create);
router.get('/', invoiceController.findAll);
router.get('/:id', invoiceController.findById);
router.put('/:id', invoiceController.update);
router.delete('/:id', invoiceController.remove);

module.exports = router;
