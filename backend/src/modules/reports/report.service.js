import prisma from '../../config/db.js';

const dateFilter = (from, to) => {
  if (!from && !to) return {};
  const gte = from ? new Date(from) : undefined;
  const lte = to ? new Date(to) : undefined;
  if (gte && isNaN(gte.getTime())) return {};
  if (lte && isNaN(lte.getTime())) return {};
  return { createdAt: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } };
};

export const salesReport = async (orgId, query) => {
  const where = { organizationId: orgId, deletedAt: null, ...dateFilter(query.from, query.to) };
  if (query.pipelineId) where.pipelineId = query.pipelineId;

  const [total, byStatus, byPipeline, revenue] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.groupBy({ by: ['status'], where, _count: { id: true }, _sum: { amount: true } }),
    prisma.deal.groupBy({ by: ['pipelineId'], where, _count: { id: true }, _sum: { amount: true } }),
    prisma.deal.aggregate({ where: { ...where, status: 'WON' }, _sum: { amount: true } }),
  ]);

  // enrich pipeline names
  const pipelines = await prisma.pipeline.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } });
  const pipeMap = Object.fromEntries(pipelines.map((p) => [p.id, p.name]));

  return {
    totalDeals: total,
    byStatus,
    byPipeline: byPipeline.map((b) => ({ pipelineId: b.pipelineId, pipelineName: pipeMap[b.pipelineId] || b.pipelineId, count: b._count.id, amount: b._sum.amount })),
    revenueWon: revenue._sum.amount || 0,
  };
};

export const leadsReport = async (orgId, query) => {
  const where = { organizationId: orgId, deletedAt: null, ...dateFilter(query.from, query.to) };
  if (query.status) where.status = query.status;

  const [total, byStatus, bySource] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.lead.groupBy({ by: ['source'], where, _count: { id: true } }),
  ]);

  return { totalLeads: total, byStatus, bySource };
};

export const activitiesReport = async (orgId, query) => {
  const where = { organizationId: orgId, ...dateFilter(query.from, query.to) };
  if (query.entityType) where.entityType = query.entityType;

  const [total, byType, recent] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.groupBy({ by: ['type'], where, _count: { id: true } }),
    prisma.activity.findMany({ where, take: 20, orderBy: { createdAt: 'desc' } }),
  ]);

  return { totalActivities: total, byType, recent };
};

export const toCsv = (rows, headers) => {
  const header = headers.join(',');
  const lines = rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [header, ...lines].join('\n');
};
