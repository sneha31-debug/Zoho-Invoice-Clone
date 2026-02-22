const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { invoiceRules } = require('../validators/invoiceValidator');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

// Public routes
router.get('/public/:id', invoiceController.findPublic);

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), invoiceRules, validate, invoiceController.create);
router.post('/from-billable', authorize('ADMIN', 'MANAGER', 'STAFF'), invoiceController.createFromBillable);
router.get('/', invoiceController.findAll);
router.get('/:id/pdf', invoiceController.downloadPDF);
router.post('/:id/send-email', authorize('ADMIN', 'MANAGER', 'STAFF'), invoiceController.sendEmail);
router.get('/:id', invoiceController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), invoiceController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), invoiceController.remove);

module.exports = router;
