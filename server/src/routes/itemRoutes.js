const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), itemController.create);
router.get('/', itemController.findAll);
router.get('/:id', itemController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), itemController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), itemController.remove);

module.exports = router;
