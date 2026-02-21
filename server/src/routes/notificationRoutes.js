const express = require('express');
const router = express.Router();
const { getAll, markRead, markAllRead } = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', getAll);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
