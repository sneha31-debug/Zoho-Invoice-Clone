const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', itemController.create);
router.get('/', itemController.findAll);
router.get('/:id', itemController.findById);
router.put('/:id', itemController.update);
router.delete('/:id', itemController.remove);

module.exports = router;