import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const sendEmail = async (orgId, userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const sender = user?.email || 'noreply@crm.local';
  // In production: queue via BullMQ. For Phase 6 we mark SENT immediately and log
  const log = await prisma.emailLog.create({
    data: {
      organizationId: orgId,
      sender,
      recipient: data.recipient,
      subject: data.subject,
      body: data.body,
      status: 'SENT',
      relatedEntityType: data.relatedEntityType || null,
      relatedEntityId: data.relatedEntityId || null,
      sentAt: new Date(),
    },
  });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'EmailLog', resourceId: log.id, newValues: log } });
  await prisma.activity.create({ data: { organizationId: orgId, type: 'EMAIL', title: `Email to ${data.recipient}`, entityType: data.relatedEntityType || 'CONTACT', entityId: data.relatedEntityId || log.id, actorId: userId, metadata: { recipient: data.recipient, subject: data.subject } } });
  return log;
};

export const listEmails = async (orgId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { organizationId: orgId };
  if (query.relatedEntityType) where.relatedEntityType = query.relatedEntityType;
  if (query.relatedEntityId) where.relatedEntityId = query.relatedEntityId;
  if (query.status) where.status = query.status;
  const [data, total] = await Promise.all([
    prisma.emailLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.emailLog.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getEmail = async (id, orgId) => {
  const e = await prisma.emailLog.findFirst({ where: { id, organizationId: orgId } });
  if (!e) throw new NotFoundError('Email not found');
  return e;
};
