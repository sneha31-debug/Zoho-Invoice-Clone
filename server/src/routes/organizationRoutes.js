const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
    }
});

router.use(authMiddleware);

router.get('/', organizationController.getOrganization);
router.put('/', authorize('ADMIN', 'MANAGER'), organizationController.updateOrganization);
router.post('/logo', authorize('ADMIN', 'MANAGER'), upload.single('logo'), organizationController.uploadLogo);

module.exports = router;
