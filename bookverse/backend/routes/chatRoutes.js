const express = require('express');
const router = express.Router();
const writerCtrl = require('../controllers/writerController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/conversation', writerCtrl.getOrCreateConversation);
router.get('/conversations', writerCtrl.getConversations);
router.get('/conversation/:conversationId/messages', writerCtrl.getMessages);

module.exports = router;
