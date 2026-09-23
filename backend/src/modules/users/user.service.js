import bcrypt from 'bcrypt';
import prisma from '../../config/db.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

export const listUsers = async (organizationId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { memberships: { some: { organizationId } } };
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.status) where.status = query.status;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      include: {
        role: true,
        memberships: { where: { organizationId }, include: { role: true, organization: true } },
        teams: { include: { team: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  const sanitized = data.map(({ password, ...u }) => u);
  return { data: sanitized, pagination: buildPaginationMeta(total, page, limit) };
};

export const getUser = async (id, organizationId) => {
  const user = await prisma.user.findFirst({
    where: { id, memberships: { some: { organizationId } } },
    include: { role: true, memberships: { where: { organizationId }, include: { role: true } } },
  });
  if (!user) throw new NotFoundError('User not found in organization');
  const { password, ...safe } = user;
  return safe;
};

export const createUser = async (organizationId, data) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  let user;
  if (exists) {
    // if user exists but not in org, add membership
    const alreadyMember = await prisma.organizationMember.findFirst({ where: { userId: exists.id, organizationId } });
    if (alreadyMember) throw new ConflictError('Email already in organization');
    // validate role belongs to org or is system role
    if (data.roleId) {
      const role = await prisma.role.findFirst({ where: { id: data.roleId, OR: [{ organizationId }, { organizationId: null }] } });
      if (!role) throw new BadRequestError('Invalid role');
    }
    await prisma.organizationMember.create({ data: { organizationId, userId: exists.id, roleId: data.roleId || null } });
    if (data.teamId) {
      const team = await prisma.team.findFirst({ where: { id: data.teamId, organizationId } });
      if (!team) throw new BadRequestError('Invalid team');
      await prisma.teamMember.create({ data: { teamId: data.teamId, userId: exists.id } });
    }
    user = await prisma.user.findUnique({ where: { id: exists.id } });
  } else {
    const hashed = await bcrypt.hash(data.password, 10);
    if (data.roleId) {
      const role = await prisma.role.findFirst({ where: { id: data.roleId, OR: [{ organizationId }, { organizationId: null }] } });
      if (!role) throw new BadRequestError('Invalid role');
    }
    user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { email: normalizedEmail, password: hashed, firstName: data.firstName, lastName: data.lastName, status: 'ACTIVE' } });
      await tx.organizationMember.create({ data: { organizationId, userId: u.id, roleId: data.roleId || null } });
      if (data.teamId) {
        const team = await tx.team.findFirst({ where: { id: data.teamId, organizationId } });
        if (!team) throw new BadRequestError('Invalid team');
        await tx.teamMember.create({ data: { teamId: data.teamId, userId: u.id } });
      }
      return u;
    });
  }
  const { password, ...safe } = user;
  return safe;
};

export const updateUser = async (id, organizationId, data) => {
  const member = await prisma.organizationMember.findFirst({ where: { userId: id, organizationId } });
  if (!member) throw new NotFoundError('User not in organization');
  if (data.roleId !== undefined) {
    if (data.roleId === null) {
      await prisma.organizationMember.update({ where: { id: member.id }, data: { roleId: null } });
    } else {
      const role = await prisma.role.findFirst({ where: { id: data.roleId, OR: [{ organizationId }, { organizationId: null }] } });
      if (!role) throw new BadRequestError('Invalid role');
      await prisma.organizationMember.update({ where: { id: member.id }, data: { roleId: data.roleId } });
    }
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { firstName: data.firstName, lastName: data.lastName, status: data.status },
  });
  const { password, ...safe } = updated;
  return safe;
};

export const removeUser = async (id, organizationId) => {
  const member = await prisma.organizationMember.findFirst({ where: { userId: id, organizationId } });
  if (!member) throw new NotFoundError('User not in organization');
  await prisma.$transaction(async (tx) => {
    await tx.teamMember.deleteMany({ where: { userId: id, team: { organizationId } } });
    await tx.organizationMember.delete({ where: { id: member.id } });
    // keep user record for audit; don't delete user globally unless no orgs left
    const remaining = await tx.organizationMember.count({ where: { userId: id } });
    if (remaining === 0) {
      // optionally soft-deactivate
      await tx.user.update({ where: { id }, data: { status: 'INACTIVE' } });
    }
  });
  return { message: 'User removed from organization' };
};
