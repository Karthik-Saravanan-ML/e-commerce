const express = require('express');
const router = express.Router();
const writerCtrl = require('../controllers/writerController');
const mainCtrl = require('../controllers/mainController');
const { protect, authorize } = require('../middleware/auth');

router.get('/search', writerCtrl.searchWriters);
router.get('/conversations', protect, writerCtrl.getConversations);
router.get('/analytics', protect, authorize('writer', 'admin'), mainCtrl.getWriterAnalytics);
router.post('/conversation', protect, writerCtrl.getOrCreateConversation);
router.get('/conversation/:conversationId/messages', protect, writerCtrl.getMessages);
router.put('/friend-request/:requestId', protect, writerCtrl.respondFriendRequest);
router.get('/:id', writerCtrl.getWriterProfile);
router.post('/:id/friend-request', protect, authorize('writer', 'admin'), writerCtrl.sendFriendRequest);

module.exports = router;
