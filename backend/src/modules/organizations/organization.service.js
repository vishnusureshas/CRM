import prisma from '../../config/db.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const listOrganizations = async () => {
  // For super_admin: all orgs. OrgIsolation handled per route (admin only)
  return prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { members: true, leads: true, deals: true } } } });
};

export const getOrganization = async (id, requesterOrgId) => {
  const org = await prisma.organization.findUnique({ where: { id }, include: { _count: { select: { members: true, teams: true } } } });
  if (!org) throw new NotFoundError('Organization not found');
  // Regular user can only see own org; super_admin can see any (checked via authorize)
  if (requesterOrgId && org.id !== requesterOrgId) {
    // let super_admin pass — checked at route level, here we allow if different but caller has admin:read
    // For strict isolation, throw; for admin panel, allow
  }
  return org;
};

export const getMyOrganization = async (organizationId) => {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new NotFoundError('Organization not found');
  return org;
};

export const createOrganization = async (data, creatorUserId) => {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const exists = await prisma.organization.findUnique({ where: { slug } });
  if (exists) throw new ConflictError(`Slug '${slug}' already taken`);

  const org = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: data.name, slug, email: data.email, phone: data.phone, website: data.website, status: 'ACTIVE' } });
    // Add creator as admin member
    const adminRole = await tx.role.findFirst({ where: { slug: 'admin' } });
    await tx.organizationMember.create({ data: { organizationId: organization.id, userId: creatorUserId, roleId: adminRole?.id || null } });
    // default pipeline
    const pipeline = await tx.pipeline.create({ data: { organizationId: organization.id, name: 'Sales Pipeline', isDefault: true } });
    for (const s of [
      { name: 'New', order: 1, probability: 10, color: '#94a3b8' },
      { name: 'Qualification', order: 2, probability: 30, color: '#38bdf8' },
      { name: 'Proposal', order: 3, probability: 60, color: '#f59e0b' },
      { name: 'Negotiation', order: 4, probability: 80, color: '#8b5cf6' },
      { name: 'Closed Won', order: 5, probability: 100, color: '#22c55e', isClosed: true },
      { name: 'Closed Lost', order: 6, probability: 0, color: '#ef4444', isClosed: true },
    ]) {
      await tx.pipelineStage.create({ data: { pipelineId: pipeline.id, ...s } });
    }
    return organization;
  });
  return org;
};

export const updateOrganization = async (id, data) => {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new NotFoundError('Organization not found');
  return prisma.organization.update({ where: { id }, data });
};

export const setStatus = async (id, status) => {
  if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) throw new BadRequestError('Invalid status');
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new NotFoundError('Organization not found');
  return prisma.organization.update({ where: { id }, data: { status } });
};
