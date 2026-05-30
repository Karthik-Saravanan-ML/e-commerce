const express = require('express');
const router = express.Router();
const mainCtrl = require('../controllers/mainController');
const { protect } = require('../middleware/auth');

router.get('/:bookId', mainCtrl.getBookReviews);
router.post('/:bookId', protect, mainCtrl.createReview);
router.put('/:reviewId/like', protect, mainCtrl.likeReview);

module.exports = router;
