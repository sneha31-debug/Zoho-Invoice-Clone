const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', quoteController.create);
router.get('/', quoteController.findAll);
router.get('/:id', quoteController.findById);
router.put('/:id', quoteController.update);
router.delete('/:id', quoteController.remove);
router.post('/:id/convert', quoteController.convertToInvoice);

module.exports = router;
