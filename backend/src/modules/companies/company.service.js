import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const listCompanies = async (orgId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
  const [data, total] = await Promise.all([
    prisma.company.findMany({ where: { ...where, organizationId: orgId, deletedAt: null }, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { contacts: true, deals: true } }),
    prisma.company.count({ where: { ...where, organizationId: orgId, deletedAt: null } }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};
export const getCompany = async (id, orgId) => {
  const c = await prisma.company.findFirst({ where: { id, organizationId: orgId, deletedAt: null }, include: { contacts: true, deals: true } });
  if (!c) throw new NotFoundError('Company not found');
  const [activities, notes] = await Promise.all([
    prisma.activity.findMany({ where: { organizationId: orgId, entityType: 'COMPANY', entityId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.note.findMany({ where: { organizationId: orgId, entityType: 'COMPANY', entityId: id }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { ...c, activities, notes };
};
export const createCompany = async (orgId, userId, data) => {
  const c = await prisma.company.create({ data: { organizationId: orgId, name: data.name, website: data.website, industry: data.industry, ownerId: userId } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'Company', resourceId: c.id } });
  return c;
};
export const updateCompany = async (id, orgId, userId, data) => {
  const exists = await prisma.company.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!exists) throw new NotFoundError('Company not found');
  const updated = await prisma.company.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Company', resourceId: id } });
  return updated;
};
export const deleteCompany = async (id, orgId, userId) => {
  const exists = await prisma.company.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!exists) throw new NotFoundError('Company not found');
  await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'DELETE', resource: 'Company', resourceId: id } });
  return { message: 'Company deleted' };
};
