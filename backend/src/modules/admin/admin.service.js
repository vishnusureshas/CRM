import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';

export const getDashboard = async () => {
  const [orgs, users, leads, contacts, companies, deals, pipelines, tasks, revenueAgg, auditCount] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.contact.count({ where: { deletedAt: null } }),
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.deal.count({ where: { deletedAt: null } }),
    prisma.pipeline.count(),
    prisma.task.count({ where: { deletedAt: null } }),
    prisma.deal.aggregate({ _sum: { amount: true }, where: { status: 'WON', deletedAt: null } }),
    prisma.auditLog.count(),
  ]);

  return {
    organizations: orgs,
    users,
    leads,
    contacts,
    companies,
    deals,
    pipelines,
    tasks,
    revenue: Number(revenueAgg._sum.amount || 0),
    auditLogs: auditCount,
  };
};

export const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { role: true, memberships: { include: { organization: true } } } }),
    prisma.user.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const updateUserStatus = async (id, status, actorId) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  const updated = await prisma.user.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({ data: { userId: actorId, action: 'UPDATE', resource: 'User', resourceId: id, newValues: { status } } });
  return updated;
};

export const listOrgs = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { slug: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.organization.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.organization.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const updateOrgStatus = async (id, status, actorId) => {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new NotFoundError('Organization not found');
  const updated = await prisma.organization.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({ data: { organizationId: id, userId: actorId, action: 'UPDATE', resource: 'Organization', resourceId: id, newValues: { status } } });
  return updated;
};

export const listAuditLogs = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.action) where.action = query.action;
  if (query.resource) where.resource = query.resource;
  if (query.organizationId) where.organizationId = query.organizationId;
  if (query.userId) where.userId = query.userId;
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.auditLog.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};
