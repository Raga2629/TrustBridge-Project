import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { uploadFields } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import { createNotification, emitNotification } from '../utils/notifications.js';

const router = express.Router();

router.get('/conversations', protect, asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar role')
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  res.json({ success: true, data: conversations });
}));

router.post('/conversations', protect, asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  const participant = await User.findById(participantId);
  if (!participant) throw new AppError('User not found', 404);

  // Prevent self-messaging
  if (participantId.toString() === req.user._id.toString()) {
    throw new AppError('You cannot start a conversation with yourself', 400);
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      lastMessage: '',
      lastMessageAt: new Date(),
    });
  }

  conversation = await conversation.populate('participants', 'name avatar role');
  res.json({ success: true, data: conversation });
}));

router.get('/conversations/:id/messages', protect, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation?.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new AppError('Not authorized', 403);
  }

  const messages = await Message.find({ conversation: req.params.id })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 });

  await Message.updateMany(
    { conversation: req.params.id, sender: { $ne: req.user._id }, isRead: false },
    { isRead: true, $addToSet: { readBy: req.user._id } }
  );

  // Reset unread count for this user
  const conv = await Conversation.findById(req.params.id);
  if (conv) {
    conv.unreadCount.set(req.user._id.toString(), 0);
    await conv.save();
  }

  res.json({ success: true, data: messages });
}));

router.post('/conversations/:id/messages', protect, uploadFields, asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation?.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new AppError('Not authorized', 403);
  }

  let fileUrl = '';
  let fileType = '';
  if (req.files?.file?.[0]) {
    fileUrl = await uploadToCloudinary(req.files.file[0].buffer, 'trustbridge/chat');
    fileType = req.files.file[0].mimetype;
  }

  const message = await Message.create({
    conversation: req.params.id,
    sender: req.user._id,
    content: req.body.content || '',
    fileUrl,
    fileType,
  });

  conversation.lastMessage    = req.body.content || 'Sent a file';
  conversation.lastMessageAt  = new Date();

  // Increment unread count for all participants except the sender
  for (const participantId of conversation.participants) {
    if (participantId.toString() !== req.user._id.toString()) {
      const key = participantId.toString();
      conversation.unreadCount.set(key, (conversation.unreadCount.get(key) || 0) + 1);
    }
  }
  await conversation.save();

  const populated = await message.populate('sender', 'name avatar');
  const io = req.app.get('io');

  io.to(`conversation:${req.params.id}`).emit('new_message', populated);

  const recipientId = conversation.participants.find(
    (p) => p.toString() !== req.user._id.toString()
  );
  const notification = await createNotification(
    recipientId, 'message', 'New Message',
    `${req.user.name}: ${req.body.content?.substring(0, 50) || 'Sent a file'}`,
    `/chat/${req.params.id}`
  );
  emitNotification(io, recipientId.toString(), notification);

  res.status(201).json({ success: true, data: populated });
}));

export default router;
