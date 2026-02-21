const express = require('express');
const router = express.Router();
const timeTrackingController = require('../controllers/timeTrackingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), timeTrackingController.create);
router.get('/', timeTrackingController.findAll);
router.get('/:id', timeTrackingController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), timeTrackingController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), timeTrackingController.remove);

module.exports = router;
