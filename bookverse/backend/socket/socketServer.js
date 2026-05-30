const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { saveMessage } = require('../controllers/writerController');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} [${socket.id}]`);

    // Join personal room for notifications
    socket.join(`user_${socket.user._id}`);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Send message
    socket.on('send_message', async ({ conversationId, text }) => {
      try {
        const message = await saveMessage({
          conversationId,
          senderId: socket.user._id,
          text,
        });

        if (!message) return;

        // Populate sender info
        const populated = await message.populate('sender', 'name avatar');

        // Broadcast to all in the conversation with per-user translation
        const roomSockets = await io.in(`conversation_${conversationId}`).fetchSockets();

        for (const roomSocket of roomSockets) {
          const receiverLanguage = roomSocket.user?.preferredLanguage || 'en';
          const translation = populated.translatedTexts?.find(t => t.language === receiverLanguage);
          const displayText = translation ? translation.text : populated.originalText;

          roomSocket.emit('new_message', {
            _id: populated._id,
            sender: populated.sender,
            originalText: populated.originalText,
            displayText,
            conversationId,
            createdAt: populated.createdAt,
          });
        }
      } catch (err) {
        socket.emit('error', { message: 'Message failed to send' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', { userId: socket.user._id });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId }) => {
      const { Message } = require('../models/index');
      await Message.updateMany(
        { conversation: conversationId, sender: { $ne: socket.user._id }, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      socket.to(`conversation_${conversationId}`).emit('messages_read', { conversationId, by: socket.user._id });
    });

    // Order tracking update (admin sends, user receives)
    socket.on('order_update', ({ userId, orderId, status }) => {
      io.to(`user_${userId}`).emit('order_status_update', { orderId, status });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket not initialized');
  return io;
};

module.exports = { initSocket, getIO };
