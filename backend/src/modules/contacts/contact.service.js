import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const listContacts = async (orgId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.search) where.OR = [{ firstName: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }];
  const [data, total] = await Promise.all([
    prisma.contact.findMany({ where: { ...where, organizationId: orgId, deletedAt: null }, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { company: true } }),
    prisma.contact.count({ where: { ...where, organizationId: orgId, deletedAt: null } }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getContact = async (id, orgId) => {
  const c = await prisma.contact.findFirst({ where: { id, organizationId: orgId, deletedAt: null }, include: { company: true } });
  if (!c) throw new NotFoundError('Contact not found');
  const [activities, notes] = await Promise.all([
    prisma.activity.findMany({ where: { organizationId: orgId, entityType: 'CONTACT', entityId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.note.findMany({ where: { organizationId: orgId, entityType: 'CONTACT', entityId: id }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { ...c, activities, notes };
};

export const createContact = async (orgId, userId, data) => {
  const c = await prisma.contact.create({ data: { organizationId: orgId, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, companyId: data.companyId, jobTitle: data.jobTitle, ownerId: data.ownerId || userId } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'Contact', resourceId: c.id } });
  return c;
};

export const updateContact = async (id, orgId, userId, data) => {
  const exists = await prisma.contact.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!exists) throw new NotFoundError('Contact not found');
  const updated = await prisma.contact.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Contact', resourceId: id } });
  return updated;
};

export const deleteContact = async (id, orgId, userId) => {
  const exists = await prisma.contact.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!exists) throw new NotFoundError('Contact not found');
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'DELETE', resource: 'Contact', resourceId: id } });
  return { message: 'Contact deleted' };
};
