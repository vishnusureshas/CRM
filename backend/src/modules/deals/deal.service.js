import prisma from '../../config/db.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

const validatePipelineAndStage = async (organizationId, pipelineId, stageId) => {
  const pipeline = await prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId } });
  if (!pipeline) throw new BadRequestError('Pipeline not in organization');
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId } });
  if (!stage) throw new BadRequestError('Stage not in pipeline');
  return { pipeline, stage };
};

export const listDeals = async (orgId, query) => {
  const { page, limit, skip, sortBy, sortOrder } = parsePagination(query);
  const where = { organizationId: orgId, deletedAt: null };
  if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }];
  if (query.status) where.status = query.status;
  if (query.pipelineId) where.pipelineId = query.pipelineId;
  if (query.stageId) where.stageId = query.stageId;
  if (query.ownerId) where.ownerId = query.ownerId;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }
  const allowedSort = ['createdAt', 'amount', 'name', 'updatedAt', 'expectedCloseDate'];
  const orderBy = allowedSort.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' };
  const [data, total] = await Promise.all([
    prisma.deal.findMany({ where, skip, take: limit, orderBy, include: { pipeline: true, stage: true, company: true, contact: true } }),
    prisma.deal.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getDeal = async (id, orgId) => {
  const deal = await prisma.deal.findFirst({ where: { id, organizationId: orgId, deletedAt: null }, include: { pipeline: true, stage: true, company: true, contact: true } });
  if (!deal) throw new NotFoundError('Deal not found');
  const [activities, notes] = await Promise.all([
    prisma.activity.findMany({ where: { organizationId: orgId, entityType: 'DEAL', entityId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.note.findMany({ where: { organizationId: orgId, entityType: 'DEAL', entityId: id }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { ...deal, activities, notes };
};

export const createDeal = async (orgId, userId, data) => {
  await validatePipelineAndStage(orgId, data.pipelineId, data.stageId);
  if (data.companyId) {
    const c = await prisma.company.findFirst({ where: { id: data.companyId, organizationId: orgId } });
    if (!c) throw new BadRequestError('Company not in organization');
  }
  if (data.contactId) {
    const c = await prisma.contact.findFirst({ where: { id: data.contactId, organizationId: orgId } });
    if (!c) throw new BadRequestError('Contact not in organization');
  }
  if (data.ownerId) {
    const m = await prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: data.ownerId } });
    if (!m) throw new BadRequestError('Owner not in organization');
  }
  const deal = await prisma.deal.create({
    data: {
      organizationId: orgId,
      name: data.name,
      companyId: data.companyId || null,
      contactId: data.contactId || null,
      ownerId: data.ownerId || userId,
      pipelineId: data.pipelineId,
      stageId: data.stageId,
      amount: data.amount,
      currency: data.currency || 'USD',
      probability: data.probability ?? 0,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      status: data.status || 'OPEN',
      source: data.source || null,
      description: data.description || null,
    },
  });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'Deal', resourceId: deal.id, newValues: deal } });
  await prisma.activity.create({ data: { organizationId: orgId, type: 'OTHER', title: 'Deal created', entityType: 'DEAL', entityId: deal.id, actorId: userId, metadata: { dealId: deal.id } } });
  return deal;
};

export const updateDeal = async (id, orgId, userId, data) => {
  const deal = await prisma.deal.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!deal) throw new NotFoundError('Deal not found');
  // if pipeline/stage changing, validate
  const pipelineId = data.pipelineId || deal.pipelineId;
  const stageId = data.stageId || deal.stageId;
  if (data.pipelineId || data.stageId) await validatePipelineAndStage(orgId, pipelineId, stageId);
  if (data.companyId) {
    const c = await prisma.company.findFirst({ where: { id: data.companyId, organizationId: orgId } });
    if (!c) throw new BadRequestError('Company not in organization');
  }
  if (data.contactId) {
    const c = await prisma.contact.findFirst({ where: { id: data.contactId, organizationId: orgId } });
    if (!c) throw new BadRequestError('Contact not in organization');
  }
  const old = { ...deal };
  const updated = await prisma.deal.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      companyId: data.companyId ?? undefined,
      contactId: data.contactId ?? undefined,
      ownerId: data.ownerId ?? undefined,
      pipelineId: data.pipelineId ?? undefined,
      stageId: data.stageId ?? undefined,
      amount: data.amount ?? undefined,
      currency: data.currency ?? undefined,
      probability: data.probability ?? undefined,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : data.expectedCloseDate === null ? null : undefined,
      status: data.status ?? undefined,
      source: data.source ?? undefined,
      description: data.description ?? undefined,
    },
    include: { pipeline: true, stage: true },
  });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Deal', resourceId: id, oldValues: old, newValues: updated } });
  if (data.stageId && data.stageId !== old.stageId) {
    await prisma.activity.create({ data: { organizationId: orgId, type: 'STATUS_CHANGED', title: `Deal moved stage ${old.stageId} → ${data.stageId}`, entityType: 'DEAL', entityId: id, actorId: userId, metadata: { from: old.stageId, to: data.stageId } } });
  }
  return updated;
};

export const deleteDeal = async (id, orgId, userId) => {
  const deal = await prisma.deal.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!deal) throw new NotFoundError('Deal not found');
  await prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'DELETE', resource: 'Deal', resourceId: id } });
  return { message: 'Deal deleted' };
};

export const moveDealStage = async (id, orgId, userId, stageId) => {
  const deal = await prisma.deal.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!deal) throw new NotFoundError('Deal not found');
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId: deal.pipelineId } });
  if (!stage) throw new BadRequestError('Stage not in deal pipeline');
  if (deal.stageId === stageId) return deal;
  const oldStage = deal.stageId;
  const updated = await prisma.deal.update({ where: { id }, data: { stageId, probability: stage.probability } });
  await prisma.activity.create({ data: { organizationId: orgId, type: 'STATUS_CHANGED', title: `Deal moved stage`, entityType: 'DEAL', entityId: id, actorId: userId, metadata: { from: oldStage, to: stageId, probability: stage.probability } } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Deal', resourceId: id, oldValues: { stageId: oldStage }, newValues: { stageId } } });
  return updated;
};

export const closeDeal = async (id, orgId, userId, status) => {
  const deal = await prisma.deal.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!deal) throw new NotFoundError('Deal not found');
  if (deal.status !== 'OPEN') throw new BadRequestError('Only OPEN deals can be closed');
  if (!['WON', 'LOST'].includes(status)) throw new BadRequestError('Status must be WON or LOST');
  const stage = await prisma.pipelineStage.findFirst({ where: { id: deal.stageId } });
  const probability = status === 'WON' ? 100 : 0;
  const updated = await prisma.deal.update({ where: { id }, data: { status, closedAt: new Date(), probability } });
  await prisma.activity.create({ data: { organizationId: orgId, type: 'OTHER', title: `Deal ${status}`, entityType: 'DEAL', entityId: id, actorId: userId, metadata: { status, fromStage: stage?.name } } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Deal', resourceId: id, oldValues: { status: deal.status }, newValues: { status } } });
  // notification stub via audit - real would queue BullMQ
  return updated;
};
