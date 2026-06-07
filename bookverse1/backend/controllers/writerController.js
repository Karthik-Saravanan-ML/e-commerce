const User = require('../models/User');
const { Message, Conversation } = require('../models/index');
const axios = require('axios');

// @desc  Get writer public profile
// @route GET /api/writers/:id
exports.getWriterProfile = async (req, res) => {
  const writer = await User.findOne({
    _id: req.params.id,
    role: { $in: ['writer', 'admin'] },
  }).select('name avatar writerProfile.bio writerProfile.language writerProfile.country writerProfile.website writerProfile.socialLinks writerProfile.isPublic writerProfile.followers writerProfile.following');

  if (!writer) return res.status(404).json({ success: false, message: 'Writer not found' });
  if (!writer.writerProfile?.isPublic && req.user?._id?.toString() !== req.params.id) {
    return res.status(403).json({ success: false, message: 'This profile is private' });
  }

  const Book = require('../models/Book');
  const books = await Book.find({ author: req.params.id, status: 'approved' }).select('title coverImage ratings price bookId');
  res.json({ success: true, writer, books });
};

const getConnectionStatus = (currentUser, targetWriter) => {
  if (!currentUser || !targetWriter) return 'none';
  const myId = currentUser._id.toString();
  const theirId = targetWriter._id.toString();
  if (myId === theirId) return 'self';

  const myFriends = (currentUser.writerProfile?.friends || []).map((id) => id.toString());
  if (myFriends.includes(theirId)) return 'friends';

  const iSent = (targetWriter.writerProfile?.friendRequests || []).some(
    (r) => r.from?.toString() === myId && r.status === 'pending'
  );
  if (iSent) return 'pending_sent';

  const theySent = (currentUser.writerProfile?.friendRequests || []).some(
    (r) => r.from?.toString() === theirId && r.status === 'pending'
  );
  if (theySent) return 'pending_received';

  return 'none';
};

// @desc  Search writers
// @route GET /api/writers/search
exports.searchWriters = async (req, res) => {
  const { q, country, language } = req.query;
  const query = { role: 'writer', 'writerProfile.isPublic': true };
  if (q) query.$or = [{ name: { $regex: q, $options: 'i' } }];
  if (country) query['writerProfile.country'] = country;
  if (language) query['writerProfile.language'] = language;

  const writers = await User.find(query)
    .select('name avatar writerProfile')
    .limit(20);

  const me = req.user ? await User.findById(req.user._id).select('writerProfile') : null;

  const withStatus = writers.map((w) => ({
    ...w.toObject(),
    connectionStatus: getConnectionStatus(me, w),
  }));

  res.json({ success: true, writers: withStatus });
};

// @desc  Incoming friend requests
// @route GET /api/writers/friend-requests
exports.getFriendRequests = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('writerProfile.friendRequests.from', 'name avatar writerProfile.country');

  const pending = (user.writerProfile?.friendRequests || [])
    .filter(r => r.status === 'pending')
    .map(r => ({
      _id: r._id,
      from: r.from,
      status: r.status,
      createdAt: r.createdAt,
    }));

  res.json({ success: true, requests: pending });
};

// @desc  Send friend request
// @route POST /api/writers/:id/friend-request
exports.sendFriendRequest = async (req, res) => {
  const targetWriter = await User.findById(req.params.id);
  if (!targetWriter) return res.status(404).json({ success: false, message: 'Writer not found' });
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
  }

  const alreadyFriends = targetWriter.writerProfile?.friends?.includes(req.user._id);
  if (alreadyFriends) return res.status(400).json({ success: false, message: 'Already friends' });

  const alreadyRequested = targetWriter.writerProfile?.friendRequests?.some(
    r => r.from.toString() === req.user._id.toString() && r.status === 'pending'
  );
  if (alreadyRequested) return res.status(400).json({ success: false, message: 'Friend request already sent' });

  if (!targetWriter.writerProfile) targetWriter.writerProfile = {};
  if (!targetWriter.writerProfile.friendRequests) targetWriter.writerProfile.friendRequests = [];

  targetWriter.writerProfile.friendRequests.push({ from: req.user._id, status: 'pending' });
  await targetWriter.save();

  const sender = await User.findById(req.user._id);
  if (!sender.writerProfile) sender.writerProfile = { friendRequests: [] };
  if (!sender.writerProfile.friendRequests) sender.writerProfile.friendRequests = [];
  await sender.save();

  // Notify via socket
  const { getIO } = require('../socket/socketServer');
  const io = getIO();
  io.to(`user_${req.params.id}`).emit('friend_request', { from: req.user._id, name: req.user.name, avatar: req.user.avatar });

  res.json({ success: true, message: 'Friend request sent' });
};

// @desc  Respond to friend request
// @route PUT /api/writers/friend-request/:requestId
exports.respondFriendRequest = async (req, res) => {
  const { action } = req.body; // 'accept' | 'reject'
  const user = await User.findById(req.user._id);

  const requestIndex = user.writerProfile?.friendRequests?.findIndex(r => r._id.toString() === req.params.requestId);
  if (requestIndex === -1 || requestIndex === undefined) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  const request = user.writerProfile.friendRequests[requestIndex];
  request.status = action === 'accept' ? 'accepted' : 'rejected';

  if (action === 'accept') {
    user.writerProfile.friends = user.writerProfile.friends || [];
    if (!user.writerProfile.friends.some(id => id.toString() === request.from.toString())) {
      user.writerProfile.friends.push(request.from);
    }
    user.writerProfile.friendRequests[requestIndex].status = 'accepted';
    await user.save();

    const sender = await User.findById(request.from);
    if (sender) {
      if (!sender.writerProfile) sender.writerProfile = {};
      sender.writerProfile.friends = sender.writerProfile.friends || [];
      if (!sender.writerProfile.friends.some(id => id.toString() === req.user._id.toString())) {
        sender.writerProfile.friends.push(req.user._id);
      }
      await sender.save();
    }

    const { getIO } = require('../socket/socketServer');
    const io = getIO();
    io.to(`user_${request.from}`).emit('friend_request_accepted', { by: req.user._id, name: req.user.name });
  } else {
    user.writerProfile.friendRequests[requestIndex].status = 'rejected';
    await user.save();
  }

  res.json({ success: true, message: `Friend request ${action}ed` });
};

// @desc  Get or create conversation
// @route POST /api/writers/conversation
exports.getOrCreateConversation = async (req, res) => {
  const { participantId } = req.body;

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
    isGroup: false,
  }).populate('participants', 'name avatar writerProfile.language');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
    });
    conversation = await conversation.populate('participants', 'name avatar writerProfile.language');
  }

  res.json({ success: true, conversation });
};

// @desc  Get messages in conversation
// @route GET /api/writers/conversation/:conversationId/messages
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userLanguage = req.user.preferredLanguage || 'en';

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name avatar')
    .sort('createdAt')
    .limit(100);

  // Attach translated text for this user's language
  const processed = messages.map(msg => {
    const translation = msg.translatedTexts?.find(t => t.language === userLanguage);
    return {
      ...msg.toObject(),
      displayText: translation ? translation.text : msg.originalText,
    };
  });

  res.json({ success: true, messages: processed });
};

// @desc  Get user's conversations
// @route GET /api/writers/conversations
exports.getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar writerProfile.language')
    .populate('lastMessage')
    .sort('-lastMessageAt');
  res.json({ success: true, conversations });
};

// Translate text using LibreTranslate
const translateText = async (text, targetLanguage) => {
  const url = process.env.LIBRE_TRANSLATE_URL || '';
  if (!url || url.includes('your_key') || targetLanguage === 'en') return text;
  try {
    const response = await axios.post(url, {
      q: text, source: 'auto', target: targetLanguage,
      api_key: process.env.LIBRE_TRANSLATE_API_KEY || '',
    }, { timeout: 5000 });
    return response.data.translatedText || text;
  } catch {
    return text; // fallback to original if translation fails
  }
};

// Used internally by socket for translating and saving messages
exports.saveMessage = async ({ conversationId, senderId, text, messageType = 'text', fileUrl, fileName, mimeType }) => {
  const conversation = await Conversation.findById(conversationId).populate('participants', 'preferredLanguage');
  if (!conversation) return null;

  const bodyText = text || (messageType === 'image' ? '📷 Photo' : messageType === 'video' ? '🎬 Video' : messageType === 'audio' ? '🎤 Voice message' : '');

  const translations = [];
  if (messageType === 'text' && bodyText) {
    for (const participant of conversation.participants) {
      if (participant._id.toString() !== senderId.toString()) {
        const lang = participant.preferredLanguage || 'en';
        if (lang !== 'en') {
          const translated = await translateText(bodyText, lang);
          translations.push({ language: lang, text: translated });
        }
      }
    }
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    originalText: bodyText,
    translatedTexts: translations,
    messageType,
    fileUrl,
    fileName,
    mimeType,
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastMessageAt: new Date(),
  });

  return message;
};

// @desc  Upload chat media (image/video/audio)
// @route POST /api/writers/conversation/:conversationId/media
exports.uploadChatMedia = async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: req.user._id,
  });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Media file required' });

  const mime = req.file.mimetype || '';
  const name = (req.file.originalname || '').toLowerCase();
  let messageType = 'file';
  if (mime.startsWith('image/')) messageType = 'image';
  else if (mime.startsWith('audio/') || name.includes('voice') || mime === 'audio/webm') messageType = 'audio';
  else if (mime.startsWith('video/')) messageType = 'video';

  const message = await exports.saveMessage({
    conversationId,
    senderId: req.user._id,
    text: text || '',
    messageType,
    fileUrl: req.file.path,
    fileName: req.file.originalname,
    mimeType: mime,
  });

  const populated = await message.populate('sender', 'name avatar');

  const { getIO } = require('../socket/socketServer');
  const io = getIO();
  io.to(`conversation_${conversationId}`).emit('new_message', {
    _id: populated._id,
    sender: populated.sender,
    originalText: populated.originalText,
    displayText: populated.originalText,
    messageType: populated.messageType,
    fileUrl: populated.fileUrl,
    mimeType: populated.mimeType,
    conversationId,
    createdAt: populated.createdAt,
  });

  res.status(201).json({ success: true, message: populated });
};
