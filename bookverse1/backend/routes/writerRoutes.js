const express = require('express');
const router = express.Router();
const writerCtrl = require('../controllers/writerController');
const mainCtrl = require('../controllers/mainController');
const { protect, authorize } = require('../middleware/auth');
const { uploadChatMedia } = require('../middleware/upload');

router.get('/search', protect, writerCtrl.searchWriters);
router.get('/friend-requests', protect, writerCtrl.getFriendRequests);
router.get('/conversations', protect, writerCtrl.getConversations);
router.get('/analytics', protect, authorize('writer', 'admin'), mainCtrl.getWriterAnalytics);
router.post('/conversation', protect, writerCtrl.getOrCreateConversation);
router.get('/conversation/:conversationId/messages', protect, writerCtrl.getMessages);
router.post('/conversation/:conversationId/media', protect, uploadChatMedia.single('media'), writerCtrl.uploadChatMedia);
router.put('/friend-request/:requestId', protect, writerCtrl.respondFriendRequest);
router.get('/:id', writerCtrl.getWriterProfile);
router.post('/:id/friend-request', protect, authorize('writer', 'admin'), writerCtrl.sendFriendRequest);

module.exports = router;
