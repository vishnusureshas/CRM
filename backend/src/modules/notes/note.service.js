import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const listNotes = async (orgId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { organizationId: orgId };
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  const [data, total] = await Promise.all([
    prisma.note.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.note.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};
export const createNote = async (orgId, userId, data) => {
  return prisma.note.create({ data: { organizationId: orgId, content: data.content, authorId: userId, entityType: data.entityType, entityId: data.entityId } });
};
export const deleteNote = async (id, orgId) => {
  const n = await prisma.note.findFirst({ where: { id, organizationId: orgId } });
  if (!n) throw new NotFoundError('Note not found');
  await prisma.note.delete({ where: { id } });
  return { message: 'Note deleted' };
};
