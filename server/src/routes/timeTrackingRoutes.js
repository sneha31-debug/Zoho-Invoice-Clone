const express = require('express');
const router = express.Router();
const timeTrackingController = require('../controllers/timeTrackingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', timeTrackingController.create);
router.get('/', timeTrackingController.findAll);
router.get('/:id', timeTrackingController.findById);
router.put('/:id', timeTrackingController.update);
router.delete('/:id', timeTrackingController.remove);

module.exports = router;
