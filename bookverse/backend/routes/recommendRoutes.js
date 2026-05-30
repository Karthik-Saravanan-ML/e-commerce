const express = require('express');
const router = express.Router();
const recCtrl = require('../controllers/recommendController');
const { protect } = require('../middleware/auth');

router.get('/trending', recCtrl.getTrending);
router.get('/similar/:bookId', recCtrl.getSimilarBooks);
router.get('/', protect, recCtrl.getRecommendations);

module.exports = router;
