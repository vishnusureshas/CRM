import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const listNotifications = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { userId };
  if (query.isRead === 'true') where.isRead = true;
  if (query.isRead === 'false') where.isRead = false;
  if (query.type) where.type = query.type;
  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
  ]);
  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
  return { data, pagination: buildPaginationMeta(total, page, limit), unreadCount };
};

export const createNotification = async (actorId, data) => {
  const targetUserId = data.userId || actorId;
  const n = await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: data.type,
      title: data.title,
      message: data.message || null,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
    },
  });
  return n;
};

export const markRead = async (id, userId) => {
  const n = await prisma.notification.findFirst({ where: { id, userId } });
  if (!n) throw new NotFoundError('Notification not found');
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
};

export const markAllRead = async (userId) => {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return { message: 'All notifications marked read' };
};

export const removeNotification = async (id, userId) => {
  const n = await prisma.notification.findFirst({ where: { id, userId } });
  if (!n) throw new NotFoundError('Notification not found');
  await prisma.notification.delete({ where: { id } });
  return { message: 'Notification deleted' };
};
