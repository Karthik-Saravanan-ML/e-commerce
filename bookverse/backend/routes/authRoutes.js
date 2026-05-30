const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', protect, authCtrl.getMe);
router.put('/profile', protect, authCtrl.updateProfile);
router.put('/avatar', protect, uploadAvatar.single('avatar'), authCtrl.updateAvatar);
router.put('/writer-profile', protect, authCtrl.updateWriterProfile);
router.post('/forgot-password', authCtrl.forgotPassword);
router.put('/reset-password/:token', authCtrl.resetPassword);

module.exports = router;
