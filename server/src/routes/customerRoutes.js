const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { customerRules } = require('../validators/customerValidator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');

// All customer routes are protected
router.use(authMiddleware);

router.post('/', customerRules, validate, customerController.create);
router.get('/', customerController.findAll);
router.get('/:id', customerController.findById);
router.put('/:id', customerRules, validate, customerController.update);
router.delete('/:id', customerController.remove);

module.exports = router;
