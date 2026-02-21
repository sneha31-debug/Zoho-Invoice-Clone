const express = require('express');
const router = express.Router();
const controller = require('../controllers/creditNoteController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), controller.remove);

module.exports = router;
