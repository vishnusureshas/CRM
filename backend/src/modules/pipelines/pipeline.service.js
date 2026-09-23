import prisma from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors.js';

const CACHE_TTL = 60;
const cacheKey = (orgId) => `pipelines:${orgId}`;
const invalidateCache = async (orgId) => {
  if (redis.status === 'ready') {
    try { await redis.del(cacheKey(orgId)); } catch {}
  }
};

export const listPipelines = async (orgId, query) => {
  if (redis.status === 'ready' && !query.search && !query.page) {
    try {
      const cached = await redis.get(cacheKey(orgId));
      if (cached) return JSON.parse(cached);
    } catch {}
  }
  const { page, limit, skip, sortBy, sortOrder } = parsePagination(query);
  const where = { organizationId: orgId };
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
  const allowedSort = ['createdAt', 'name', 'updatedAt'];
  const orderBy = allowedSort.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' };
  const [data, total] = await Promise.all([
    prisma.pipeline.findMany({ where, skip, take: limit, orderBy, include: { stages: { orderBy: { order: 'asc' } } } }),
    prisma.pipeline.count({ where }),
  ]);
  const result = { data, pagination: buildPaginationMeta(total, page, limit) };
  if (redis.status === 'ready' && !query.search) {
    try { await redis.set(cacheKey(orgId), JSON.stringify(result), 'EX', CACHE_TTL); } catch {}
  }
  return result;
};

export const getPipeline = async (id, orgId) => {
  const pipeline = await prisma.pipeline.findFirst({ where: { id, organizationId: orgId }, include: { stages: { orderBy: { order: 'asc' } } } });
  if (!pipeline) throw new NotFoundError('Pipeline not found');
  return pipeline;
};

export const createPipeline = async (orgId, userId, data) => {
  const exists = await prisma.pipeline.findFirst({ where: { organizationId: orgId, name: data.name } });
  if (exists) throw new ConflictError('Pipeline name already exists in organization');

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.pipeline.updateMany({ where: { organizationId: orgId, isDefault: true }, data: { isDefault: false } });
    }
    const pipeline = await tx.pipeline.create({
      data: { organizationId: orgId, name: data.name, description: data.description || null, isDefault: data.isDefault || false },
    });
    await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'Pipeline', resourceId: pipeline.id, newValues: pipeline } });
    await invalidateCache(orgId);
    return pipeline;
  });
};

export const updatePipeline = async (id, orgId, userId, data) => {
  const pipeline = await prisma.pipeline.findFirst({ where: { id, organizationId: orgId } });
  if (!pipeline) throw new NotFoundError('Pipeline not found');
  if (data.name && data.name !== pipeline.name) {
    const dup = await prisma.pipeline.findFirst({ where: { organizationId: orgId, name: data.name, NOT: { id } } });
    if (dup) throw new ConflictError('Pipeline name already exists');
  }
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.pipeline.updateMany({ where: { organizationId: orgId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
    }
    const old = { ...pipeline };
    const updated = await tx.pipeline.update({ where: { id }, data: { name: data.name ?? undefined, description: data.description ?? undefined, isDefault: data.isDefault ?? undefined }, include: { stages: { orderBy: { order: 'asc' } } } });
    await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Pipeline', resourceId: id, oldValues: old, newValues: updated } });
    await invalidateCache(orgId);
    return updated;
  });
};

export const deletePipeline = async (id, orgId, userId) => {
  const pipeline = await prisma.pipeline.findFirst({ where: { id, organizationId: orgId }, include: { deals: { take: 1 } } });
  if (!pipeline) throw new NotFoundError('Pipeline not found');
  if (pipeline.isDefault) throw new BadRequestError('Cannot delete default pipeline');
  if (pipeline.deals.length > 0) throw new BadRequestError('Cannot delete pipeline with existing deals');
  await prisma.pipeline.delete({ where: { id } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'DELETE', resource: 'Pipeline', resourceId: id } });
  await invalidateCache(orgId);
  return { message: 'Pipeline deleted' };
};

// ── Stages ──
export const createStage = async (pipelineId, orgId, userId, data) => {
  const pipeline = await prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId: orgId } });
  if (!pipeline) throw new NotFoundError('Pipeline not found');
  const dupOrder = await prisma.pipelineStage.findFirst({ where: { pipelineId, order: data.order } });
  if (dupOrder) throw new ConflictError(`Stage order ${data.order} already exists`);
  const stage = await prisma.pipelineStage.create({
    data: { pipelineId, name: data.name, order: data.order, probability: data.probability ?? 0, color: data.color || null, isClosed: data.isClosed || false },
  });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'PipelineStage', resourceId: stage.id, newValues: stage } });
  await invalidateCache(orgId);
  return stage;
};

export const updateStage = async (pipelineId, stageId, orgId, userId, data) => {
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId, pipeline: { organizationId: orgId } } });
  if (!stage) throw new NotFoundError('Stage not found');
  if (data.order && data.order !== stage.order) {
    const dup = await prisma.pipelineStage.findFirst({ where: { pipelineId, order: data.order, NOT: { id: stageId } } });
    if (dup) throw new ConflictError(`Stage order ${data.order} already exists`);
  }
  const old = { ...stage };
  const updated = await prisma.pipelineStage.update({ where: { id: stageId }, data: { name: data.name ?? undefined, order: data.order ?? undefined, probability: data.probability ?? undefined, color: data.color ?? undefined, isClosed: data.isClosed ?? undefined } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'PipelineStage', resourceId: stageId, oldValues: old, newValues: updated } });
  await invalidateCache(orgId);
  return updated;
};

export const deleteStage = async (pipelineId, stageId, orgId, userId) => {
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId, pipeline: { organizationId: orgId } }, include: { deals: { take: 1 } } });
  if (!stage) throw new NotFoundError('Stage not found');
  if (stage.deals.length > 0) throw new BadRequestError('Cannot delete stage with existing deals');
  await prisma.pipelineStage.delete({ where: { id: stageId } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'DELETE', resource: 'PipelineStage', resourceId: stageId } });
  await invalidateCache(orgId);
  return { message: 'Stage deleted' };
};

export const reorderStages = async (pipelineId, orgId, userId, stages) => {
  const pipeline = await prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId: orgId } });
  if (!pipeline) throw new NotFoundError('Pipeline not found');
  // validate all stage ids belong to pipeline
  const existing = await prisma.pipelineStage.findMany({ where: { pipelineId } });
  const existingIds = new Set(existing.map((s) => s.id));
  for (const s of stages) if (!existingIds.has(s.id)) throw new BadRequestError(`Stage ${s.id} not in pipeline`);
  // ensure no duplicate orders in payload
  const orders = stages.map((s) => s.order);
  if (new Set(orders).size !== orders.length) throw new BadRequestError('Duplicate order values in payload');

  return prisma.$transaction(async (tx) => {
    // avoid unique violation when swapping: first offset by +1000
    for (const s of stages) {
      await tx.pipelineStage.update({ where: { id: s.id }, data: { order: s.order + 1000 } });
    }
    for (const s of stages) {
      await tx.pipelineStage.update({ where: { id: s.id }, data: { order: s.order } });
    }
    await tx.auditLog.create({ data: { organizationId: orgId, userId, action: 'UPDATE', resource: 'Pipeline', resourceId: pipelineId, newValues: { reordered: stages } } });
    await invalidateCache(orgId);
    return prisma.pipeline.findFirst({ where: { id: pipelineId }, include: { stages: { orderBy: { order: 'asc' } } } });
  });
};
