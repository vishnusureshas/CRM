import prisma from '../../config/db.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors.js';
import { invalidateOrgCache } from '../../services/permission.service.js';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const listRoles = async (organizationId) => {
  return prisma.role.findMany({
    where: { OR: [{ organizationId }, { organizationId: null }] },
    include: { permissions: { include: { permission: true } }, _count: { select: { users: true, members: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

export const getRole = async (id, organizationId) => {
  const role = await prisma.role.findFirst({
    where: { id, OR: [{ organizationId }, { organizationId: null }] },
    include: { permissions: { include: { permission: true } } },
  });
  if (!role) throw new NotFoundError('Role not found');
  return role;
};

export const createRole = async (organizationId, data) => {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const exists = await prisma.role.findFirst({ where: { organizationId, slug } });
  if (exists) throw new ConflictError(`Role slug '${slug}' already exists in this organization`);

  // resolve permission ids
  let permissionIds = data.permissionIds || [];
  if (data.permissionSlugs?.length) {
    const perms = await prisma.permission.findMany({ where: { slug: { in: data.permissionSlugs } } });
    if (perms.length !== data.permissionSlugs.length) throw new BadRequestError('One or more permission slugs not found');
    permissionIds = perms.map((p) => p.id);
  } else if (permissionIds.length) {
    const count = await prisma.permission.count({ where: { id: { in: permissionIds } } });
    if (count !== permissionIds.length) throw new BadRequestError('One or more permission ids not found');
  }

  const role = await prisma.role.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      organizationId,
      permissions: permissionIds.length ? { create: permissionIds.map((pid) => ({ permissionId: pid })) } : undefined,
    },
    include: { permissions: { include: { permission: true } } },
  });
  await invalidateOrgCache(organizationId);
  return role;
};

export const updateRole = async (id, organizationId, data) => {
  const role = await prisma.role.findFirst({ where: { id, organizationId } });
  if (!role) throw new NotFoundError('Role not found or not custom');
  // system roles (organizationId null) cannot be updated via org endpoint
  if (role.organizationId === null) throw new BadRequestError('System roles cannot be modified');

  let permissionIds = data.permissionIds;
  if (data.permissionSlugs) {
    const perms = await prisma.permission.findMany({ where: { slug: { in: data.permissionSlugs } } });
    if (perms.length !== data.permissionSlugs.length) throw new BadRequestError('One or more permission slugs not found');
    permissionIds = perms.map((p) => p.id);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (permissionIds !== undefined) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length) {
        await tx.rolePermission.createMany({ data: permissionIds.map((pid) => ({ roleId: id, permissionId: pid })) });
      }
    }
    return tx.role.update({
      where: { id },
      data: { name: data.name, description: data.description },
      include: { permissions: { include: { permission: true } } },
    });
  });
  await invalidateOrgCache(organizationId);
  return updated;
};

export const deleteRole = async (id, organizationId) => {
  const role = await prisma.role.findFirst({ where: { id, organizationId } });
  if (!role) throw new NotFoundError('Role not found');
  if (role.organizationId === null) throw new BadRequestError('System roles cannot be deleted');
  const inUse = await prisma.organizationMember.count({ where: { roleId: id } });
  if (inUse > 0) throw new BadRequestError(`Role in use by ${inUse} members — reassign first`);
  await prisma.role.delete({ where: { id } });
  await invalidateOrgCache(organizationId);
  return { message: 'Role deleted' };
};
