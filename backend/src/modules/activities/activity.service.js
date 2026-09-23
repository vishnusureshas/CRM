import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const listActivities = async (orgId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { organizationId: orgId };
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  const [data, total] = await Promise.all([
    prisma.activity.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.activity.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};
export const createActivity = async (orgId, userId, data) => {
  return prisma.activity.create({ data: { organizationId: orgId, type: data.type, title: data.title, description: data.description, entityType: data.entityType, entityId: data.entityId, actorId: userId, metadata: data.metadata || {} } });
};
export const getActivity = async (id, orgId) => {
  const a = await prisma.activity.findFirst({ where: { id, organizationId: orgId } });
  if (!a) throw new NotFoundError('Activity not found');
  return a;
};
