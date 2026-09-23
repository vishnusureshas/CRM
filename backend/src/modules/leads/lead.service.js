import prisma from '../../config/db.js';
import { leadRepository } from './lead.repository.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors.js';

export const listLeads = async (organizationId, query) => {
  const { page, limit, skip, sortBy, sortOrder } = parsePagination(query);
  const allowedSort = ['createdAt','firstName','status','source','updatedAt'];
  const orderBy = allowedSort.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

  const where = {};
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { companyName: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status;
  if (query.source) where.source = query.source;
  if (query.ownerId) where.ownerId = query.ownerId;
  if (query.teamId) where.teamId = query.teamId;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }

  const [data, total] = await Promise.all([
    leadRepository.findAll({ organizationId, where, skip, take: limit, orderBy }),
    leadRepository.count({ organizationId, where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getLead = async (id, organizationId) => {
  const lead = await leadRepository.findById(id, organizationId);
  if (!lead) throw new NotFoundError('Lead not found');
  return lead;
};

export const createLead = async (organizationId, userId, data) => {
  // validate owner/team belongs to org
  if (data.ownerId) {
    const member = await prisma.organizationMember.findFirst({ where: { organizationId, userId: data.ownerId } });
    if (!member) throw new BadRequestError('Owner not in organization');
  }
  if (data.teamId) {
    const team = await prisma.team.findFirst({ where: { id: data.teamId, organizationId } });
    if (!team) throw new BadRequestError('Team not in organization');
  }

  const lead = await leadRepository.create({
    organizationId,
    ownerId: data.ownerId || userId,
    firstName: data.firstName,
    lastName: data.lastName || null,
    email: data.email || null,
    phone: data.phone || null,
    companyName: data.companyName || null,
    jobTitle: data.jobTitle || null,
    source: data.source || 'OTHER',
    status: data.status || 'NEW',
    rating: data.rating || null,
    teamId: data.teamId || null,
    description: data.description || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    website: data.website || null,
  });

  // audit
  await prisma.auditLog.create({
    data: {
      organizationId, userId, action: 'CREATE', resource: 'Lead', resourceId: lead.id,
      newValues: lead,
    },
  });

  // activity
  await prisma.activity.create({
    data: { organizationId, type: 'OTHER', title: 'Lead created', entityType: 'LEAD', entityId: lead.id, actorId: userId, metadata: { leadId: lead.id } },
  });

  return lead;
};

export const updateLead = async (id, organizationId, userId, data) => {
  const lead = await leadRepository.findById(id, organizationId);
  if (!lead) throw new NotFoundError('Lead not found');

  if (data.ownerId) {
    const member = await prisma.organizationMember.findFirst({ where: { organizationId, userId: data.ownerId } });
    if (!member) throw new BadRequestError('Owner not in organization');
  }
  if (data.teamId) {
    const team = await prisma.team.findFirst({ where: { id: data.teamId, organizationId } });
    if (!team) throw new BadRequestError('Team not in organization');
  }

  const old = { ...lead };
  const updated = await leadRepository.update(id, organizationId, {
    firstName: data.firstName ?? undefined,
    lastName: data.lastName ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    companyName: data.companyName ?? undefined,
    jobTitle: data.jobTitle ?? undefined,
    source: data.source ?? undefined,
    status: data.status ?? undefined,
    rating: data.rating ?? undefined,
    ownerId: data.ownerId ?? undefined,
    teamId: data.teamId ?? undefined,
    description: data.description ?? undefined,
    address: data.address ?? undefined,
    city: data.city ?? undefined,
    state: data.state ?? undefined,
    country: data.country ?? undefined,
    website: data.website ?? undefined,
  });

  await prisma.auditLog.create({
    data: { organizationId, userId, action: 'UPDATE', resource: 'Lead', resourceId: id, oldValues: old, newValues: updated },
  });

  if (data.status && data.status !== old.status) {
    await prisma.activity.create({
      data: { organizationId, type: 'STATUS_CHANGED', title: `Status ${old.status} → ${data.status}`, entityType: 'LEAD', entityId: id, actorId: userId, metadata: { from: old.status, to: data.status } },
    });
  }

  return updated;
};

export const deleteLead = async (id, organizationId, userId) => {
  const lead = await leadRepository.findById(id, organizationId);
  if (!lead) throw new NotFoundError('Lead not found');
  await leadRepository.softDelete(id, organizationId);
  await prisma.auditLog.create({ data: { organizationId, userId, action: 'DELETE', resource: 'Lead', resourceId: id } });
  return { message: 'Lead deleted' };
};

export const assignLead = async (id, organizationId, userId, actorId) => {
  const lead = await leadRepository.findById(id, organizationId);
  if (!lead) throw new NotFoundError('Lead not found');
  const member = await prisma.organizationMember.findFirst({ where: { organizationId, userId } });
  if (!member) throw new BadRequestError('Assignee not in organization');
  const updated = await leadRepository.update(id, organizationId, { ownerId: userId });
  await prisma.activity.create({ data: { organizationId, type: 'ASSIGNMENT', title: `Assigned to ${userId}`, entityType: 'LEAD', entityId: id, actorId, metadata: { assignedTo: userId } } });
  return updated;
};

export const convertLead = async (id, organizationId, actorId, { createDeal, deal }) => {
  const lead = await leadRepository.findById(id, organizationId);
  if (!lead) throw new NotFoundError('Lead not found');
  if (lead.status === 'CONVERTED') throw new ConflictError('Lead already converted');

  return prisma.$transaction(async (tx) => {
    // Find or create company
    let company = null;
    if (lead.companyName) {
      company = await tx.company.findFirst({ where: { organizationId, name: lead.companyName } });
      if (!company) {
        company = await tx.company.create({ data: { organizationId, name: lead.companyName, ownerId: actorId } });
      }
    }

    const contact = await tx.contact.create({
      data: {
        organizationId,
        companyId: company?.id || null,
        firstName: lead.firstName,
        lastName: lead.lastName || null,
        email: lead.email || null,
        phone: lead.phone || null,
        ownerId: lead.ownerId || actorId,
      },
    });

    let dealRecord = null;
    if (createDeal) {
      // Need pipeline/stage — use default if not provided, fallback to first available pipeline
      let pipelineId = deal?.pipelineId;
      let stageId = deal?.stageId;
      if (!pipelineId) {
        let pipeline = await tx.pipeline.findFirst({ where: { organizationId, isDefault: true } });
        if (!pipeline) {
          // Fallback: pick first pipeline for org (ordered by creation) that has at least one stage
          const allPipelines = await tx.pipeline.findMany({ where: { organizationId }, orderBy: { createdAt: 'asc' }, include: { stages: { orderBy: { order: 'asc' }, take: 1 } } });
          pipeline = allPipelines.find((p) => p.stages.length > 0) || allPipelines[0] || null;
        }
        if (!pipeline) throw new BadRequestError('No pipeline found — please create a pipeline first');
        pipelineId = pipeline.id;
        if (!stageId) {
          const stage = await tx.pipelineStage.findFirst({ where: { pipelineId, order: 1 } }) || await tx.pipelineStage.findFirst({ where: { pipelineId } });
          stageId = stage?.id;
        }
      }
      if (!stageId) throw new BadRequestError('Stage not found — please add stages to the pipeline');
      const pipelineCheck = await tx.pipelineStage.findFirst({ where: { id: stageId, pipeline: { organizationId } } });
      if (!pipelineCheck) throw new BadRequestError('Stage not in organization');

      dealRecord = await tx.deal.create({
        data: {
          organizationId,
          name: deal?.name || `${lead.firstName} Deal`,
          companyId: company?.id || null,
          contactId: contact.id,
          ownerId: lead.ownerId || actorId,
          pipelineId: pipelineId,
          stageId: stageId,
          amount: deal?.amount || 0,
          expectedCloseDate: deal?.expectedCloseDate ? new Date(deal.expectedCloseDate) : null,
          status: 'OPEN',
        },
      });
    }

    await tx.lead.update({ where: { id }, data: { status: 'CONVERTED', convertedAt: new Date() } });
    await tx.activity.create({ data: { organizationId, type: 'STATUS_CHANGED', entityType: 'LEAD', entityId: id, actorId, metadata: { from: lead.status, to: 'CONVERTED', contactId: contact.id, companyId: company?.id, dealId: dealRecord?.id } } });
    await tx.auditLog.create({ data: { organizationId, userId: actorId, action: 'UPDATE', resource: 'Lead', resourceId: id, oldValues: lead, newValues: { status: 'CONVERTED' } } });

    return { contact, company, deal: dealRecord };
  });
};

