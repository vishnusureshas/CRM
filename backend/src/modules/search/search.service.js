import prisma from '../../config/db.js';

export const globalSearch = async (organizationId, q, limit = 5) => {
  const contains = { contains: q, mode: 'insensitive' };
  const whereOrg = { organizationId };

  const [leads, contacts, companies, deals, tasks] = await Promise.all([
    prisma.lead.findMany({ where: { ...whereOrg, deletedAt: null, OR: [{ firstName: contains }, { lastName: contains }, { email: contains }, { companyName: contains }] }, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.contact.findMany({ where: { ...whereOrg, deletedAt: null, OR: [{ firstName: contains }, { lastName: contains }, { email: contains }] }, take: limit }),
    prisma.company.findMany({ where: { ...whereOrg, deletedAt: null, OR: [{ name: contains }, { email: contains }] }, take: limit }),
    prisma.deal.findMany({ where: { ...whereOrg, deletedAt: null, OR: [{ name: contains }] }, take: limit, include: { stage: true } }),
    prisma.task.findMany({ where: { ...whereOrg, deletedAt: null, OR: [{ title: contains }, { description: contains }] }, take: limit }),
  ]);

  return { leads, contacts, companies, deals, tasks, q };
};
