const express = require('express');
const router = express.Router();
const bookCtrl = require('../controllers/bookController');
const { protect, authorize, requireWriterSub, requireReadingSub } = require('../middleware/auth');
const { uploadCover, uploadPDF, uploadAudio } = require('../middleware/upload');

router.get('/best-sellers', bookCtrl.getBestSellers);
router.get('/my-books', protect, bookCtrl.getMyBooks);
router.get('/category/:category', bookCtrl.getByCategory);
router.get('/', bookCtrl.getBooks);
router.get('/:id', bookCtrl.getBook);
router.post('/', protect, authorize('writer', 'admin'), requireWriterSub, uploadCover.single('coverImage'), bookCtrl.createBook);
router.put('/:id', protect, authorize('writer', 'admin'), uploadCover.single('coverImage'), bookCtrl.updateBook);
router.delete('/:id', protect, authorize('writer', 'admin'), bookCtrl.deleteBook);
router.post('/:id/upload-pdf', protect, authorize('writer', 'admin'), uploadPDF.single('pdf'), bookCtrl.uploadSoftCopy);
router.post('/:id/upload-audio', protect, authorize('writer', 'admin'), uploadAudio.single('audio'), bookCtrl.uploadAudioChapter);
router.put('/:id/progress', protect, requireReadingSub, bookCtrl.updateProgress);

module.exports = router;
