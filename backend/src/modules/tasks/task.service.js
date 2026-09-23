import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const listTasks = async (orgId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { organizationId: orgId, deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assignedTo) where.assignedTo = query.assignedTo;
  if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
  const [data, total] = await Promise.all([
    prisma.task.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.task.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};
export const getTask = async (id, orgId) => {
  const t = await prisma.task.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!t) throw new NotFoundError('Task not found');
  return t;
};
export const createTask = async (orgId, userId, data) => {
  const t = await prisma.task.create({ data: { organizationId: orgId, title: data.title, description: data.description, priority: data.priority || 'MEDIUM', status: data.status || 'TODO', dueDate: data.dueDate ? new Date(data.dueDate) : null, assignedTo: data.assignedTo || null, createdBy: userId, relatedLeadId: data.relatedLeadId || null, relatedDealId: data.relatedDealId || null } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'Task', resourceId: t.id } });
  return t;
};
export const updateTask = async (id, orgId, userId, data) => {
  const exists = await prisma.task.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!exists) throw new NotFoundError('Task not found');
  const updated = await prisma.task.update({ where: { id }, data: { title: data.title, description: data.description, priority: data.priority, status: data.status, dueDate: data.dueDate ? new Date(data.dueDate) : undefined, assignedTo: data.assignedTo } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Task', resourceId: id } });
  return updated;
};
export const deleteTask = async (id, orgId, userId) => {
  const exists = await prisma.task.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!exists) throw new NotFoundError('Task not found');
  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'DELETE', resource: 'Task', resourceId: id } });
  return { message: 'Task deleted' };
};
export const completeTask = async (id, orgId, userId) => {
  const t = await prisma.task.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!t) throw new NotFoundError('Task not found');
  const updated = await prisma.task.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } });
  return updated;
};
