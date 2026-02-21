const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

const multer = require('multer');
const path = require('path');

// Configure multer for receipts
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|pdf/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            const error = new Error('Only images and PDFs are allowed!');
            error.statusCode = 400;
            cb(error);
        }
    }
});

router.use(authMiddleware);

router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF'), expenseController.create);
router.post('/:id/receipt', authorize('ADMIN', 'MANAGER', 'STAFF'), upload.single('receipt'), expenseController.uploadReceipt);
router.get('/', expenseController.findAll);
router.get('/:id', expenseController.findById);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), expenseController.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'STAFF'), expenseController.remove);

module.exports = router;
