import prisma from '../../config/db.js';
import { redis } from '../../config/redis.js';

const CACHE_TTL = 60;
const cacheKey = (orgId, userId) => `dashboard:${orgId}:${userId}`;

export const getDashboard = async (orgId, userId) => {
  if (redis.status === 'ready') {
    try {
      const cached = await redis.get(cacheKey(orgId, userId));
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalLeads,
    newLeads,
    convertedLeads,
    totalContacts,
    totalCompanies,
    totalDeals,
    openDeals,
    wonDeals,
    lostDeals,
    totalTasks,
    tasksDueToday,
    upcomingTasks,
    revenueAgg,
    pipelineValueAgg,
    leadsBySourceRaw,
    leadsByStatusRaw,
    dealPipelineRaw,
    recentLeads,
    recentDeals,
    tasksDue,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.lead.count({ where: { organizationId: orgId, status: 'NEW', deletedAt: null } }),
    prisma.lead.count({ where: { organizationId: orgId, status: 'CONVERTED' } }),
    prisma.contact.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.company.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.deal.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.deal.count({ where: { organizationId: orgId, status: 'OPEN', deletedAt: null } }),
    prisma.deal.count({ where: { organizationId: orgId, status: 'WON', deletedAt: null } }),
    prisma.deal.count({ where: { organizationId: orgId, status: 'LOST', deletedAt: null } }),
    prisma.task.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.task.count({ where: { organizationId: orgId, dueDate: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) }, deletedAt: null } }),
    prisma.task.findMany({ where: { organizationId: orgId, dueDate: { gte: now }, deletedAt: null }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.deal.aggregate({ where: { organizationId: orgId, status: 'WON', deletedAt: null }, _sum: { amount: true } }),
    prisma.deal.aggregate({ where: { organizationId: orgId, status: 'OPEN', deletedAt: null }, _sum: { amount: true } }),
    prisma.lead.groupBy({ by: ['source'], where: { organizationId: orgId, deletedAt: null }, _count: { source: true } }),
    prisma.lead.groupBy({ by: ['status'], where: { organizationId: orgId, deletedAt: null }, _count: { status: true } }),
    prisma.deal.groupBy({ by: ['stageId'], where: { organizationId: orgId, deletedAt: null, status: 'OPEN' }, _count: { stageId: true }, _sum: { amount: true } }),
    prisma.lead.findMany({ where: { organizationId: orgId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.deal.findMany({ where: { organizationId: orgId, deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5, include: { stage: true, pipeline: true } }),
    prisma.task.findMany({ where: { organizationId: orgId, status: { not: 'COMPLETED' }, deletedAt: null }, orderBy: { dueDate: 'asc' }, take: 5 }),
  ]);

  const revenue = Number(revenueAgg._sum.amount || 0);
  const pipelineValue = Number(pipelineValueAgg._sum.amount || 0);
  const totalLeadsForRate = totalLeads || 1;
  const conversionRate = totalLeads ? (convertedLeads / totalLeads) * 100 : 0;
  const winRateDen = wonDeals + lostDeals;
  const winRate = winRateDen ? (wonDeals / winRateDen) * 100 : 0;

  // weighted pipeline: SUM(amount * probability /100) for OPEN
  const openDealsWithProb = await prisma.deal.findMany({ where: { organizationId: orgId, status: 'OPEN', deletedAt: null }, select: { amount: true, probability: true } });
  const weightedPipeline = openDealsWithProb.reduce((sum, d) => sum + Number(d.amount) * (d.probability / 100), 0);

  // revenue over time (last 6 months by createdAt month) — JS bucket to avoid GROUP BY millisecond dead query
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const wonDealsLast6 = await prisma.deal.findMany({ where: { organizationId: orgId, status: 'WON', deletedAt: null, createdAt: { gte: sixMonthsAgo } }, select: { amount: true, createdAt: true } });
  const revenueOverTime = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const sum = wonDealsLast6.filter((x) => `${x.createdAt.getFullYear()}-${String(x.createdAt.getMonth() + 1).padStart(2, '0')}` === key).reduce((s, x) => s + Number(x.amount), 0);
    return { month: key, revenue: sum };
  });

  // deal pipeline enriched with stage names
  const stageIds = dealPipelineRaw.map((d) => d.stageId);
  const stages = stageIds.length ? await prisma.pipelineStage.findMany({ where: { id: { in: stageIds } } }) : [];
  const stageMap = new Map(stages.map((s) => [s.id, s]));
  const dealPipeline = dealPipelineRaw.map((d) => ({
    stageId: d.stageId,
    stageName: stageMap.get(d.stageId)?.name || d.stageId,
    count: d._count.stageId,
    amount: Number(d._sum.amount || 0),
    probability: stageMap.get(d.stageId)?.probability || 0,
    color: stageMap.get(d.stageId)?.color || null,
  }));

  const leadsBySource = leadsBySourceRaw.map((r) => ({ source: r.source, count: r._count.source }));
  const leadsByStatus = leadsByStatusRaw.map((r) => ({ status: r.status, count: r._count.status }));

  // monthly revenue (current month) — exclude soft-deleted
  const monthlyRevenueAgg = await prisma.deal.aggregate({
    where: { organizationId: orgId, status: 'WON', deletedAt: null, createdAt: { gte: startOfMonth } },
    _sum: { amount: true },
  });

  const result = {
    totals: {
      totalLeads,
      newLeads,
      convertedLeads,
      totalContacts,
      totalCompanies,
      totalDeals,
      openDeals,
      wonDeals,
      lostDeals,
      totalTasks,
      tasksDueToday,
    },
    revenue,
    monthlyRevenue: Number(monthlyRevenueAgg._sum.amount || 0),
    pipelineValue,
    weightedPipeline,
    conversionRate: Number(conversionRate.toFixed(2)),
    winRate: Number(winRate.toFixed(2)),
    charts: {
      revenueOverTime,
      dealPipeline,
      leadsBySource,
      leadsByStatus,
    },
    recent: { leads: recentLeads, deals: recentDeals, tasks: tasksDue, upcomingTasks },
  };

  if (redis.status === 'ready') {
    try { await redis.set(cacheKey(orgId, userId), JSON.stringify(result), 'EX', CACHE_TTL); } catch {}
  }
  return result;
};
