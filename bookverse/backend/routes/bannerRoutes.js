const express = require('express');
const router = express.Router();
const mainCtrl = require('../controllers/mainController');
const { protect, authorize } = require('../middleware/auth');
const { uploadBanner } = require('../middleware/upload');

router.get('/', mainCtrl.getBanners);
router.post('/', protect, authorize('admin'), uploadBanner.single('image'), mainCtrl.createBanner);
router.put('/:id', protect, authorize('admin'), mainCtrl.updateBanner);
router.delete('/:id', protect, authorize('admin'), mainCtrl.deleteBanner);

module.exports = router;
