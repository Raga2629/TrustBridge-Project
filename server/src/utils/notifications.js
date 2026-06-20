import Notification from '../models/Notification.js';

export const createNotification = async (userId, type, title, message, link = '', metadata = {}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
    metadata,
  });
  return notification;
};

export const notifyMultiple = async (userIds, type, title, message, link = '') => {
  const notifications = userIds.map((userId) => ({
    user: userId,
    type,
    title,
    message,
    link,
  }));
  return Notification.insertMany(notifications);
};

export const emitNotification = (io, userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};
