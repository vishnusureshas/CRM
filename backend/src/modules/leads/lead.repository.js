import prisma from '../../config/db.js';

export const leadRepository = {
  findAll: ({ organizationId, where, skip, take, orderBy }) =>
    prisma.lead.findMany({ where: { ...where, organizationId, deletedAt: null }, skip, take, orderBy }),

  count: ({ organizationId, where }) =>
    prisma.lead.count({ where: { ...where, organizationId, deletedAt: null } }),

  findById: (id, organizationId) =>
    prisma.lead.findFirst({ where: { id, organizationId, deletedAt: null } }),

  findByIdAny: (id, organizationId) =>
    prisma.lead.findFirst({ where: { id, organizationId } }),

  create: (data) => prisma.lead.create({ data }),

  update: (id, organizationId, data) =>
    prisma.lead.update({ where: { id }, data }),

  softDelete: (id, organizationId) =>
    prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } }),

  restore: (id, organizationId) =>
    prisma.lead.update({ where: { id }, data: { deletedAt: null } }),
};
