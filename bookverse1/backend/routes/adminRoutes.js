const express = require('express');
const router = express.Router();
const mainCtrl = require('../controllers/mainController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/analytics', mainCtrl.getAnalytics);
router.get('/banners', mainCtrl.adminGetBanners);
router.get('/books', mainCtrl.adminGetAllBooks);
router.put('/books/:id/approve', mainCtrl.adminApproveBook);
router.put('/books/:id/best-seller', mainCtrl.adminToggleBestSeller);
router.put('/books/:id/featured', mainCtrl.adminToggleFeatured);
router.put('/books/:id', mainCtrl.adminUpdateBook);
router.delete('/books/:id', mainCtrl.adminDeleteBook);
router.get('/users', mainCtrl.adminGetUsers);
router.put('/users/:id/toggle', mainCtrl.adminToggleUser);

module.exports = router;
