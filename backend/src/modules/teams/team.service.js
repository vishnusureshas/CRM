import prisma from '../../config/db.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export const listTeams = async (organizationId) => {
  return prisma.team.findMany({
    where: { organizationId },
    include: { members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } }, _count: { select: { members: true, leads: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getTeam = async (id, organizationId) => {
  const team = await prisma.team.findFirst({ where: { id, organizationId }, include: { members: { include: { user: true } } } });
  if (!team) throw new NotFoundError('Team not found');
  return team;
};

export const createTeam = async (organizationId, data) => {
  const team = await prisma.team.create({ data: { organizationId, name: data.name, description: data.description } });
  if (data.memberIds?.length) {
    // validate members belong to org
    const members = await prisma.organizationMember.findMany({ where: { organizationId, userId: { in: data.memberIds } } });
    if (members.length !== data.memberIds.length) throw new BadRequestError('One or more users not in organization');
    await prisma.teamMember.createMany({ data: data.memberIds.map((uid) => ({ teamId: team.id, userId: uid })) });
  }
  return getTeam(team.id, organizationId);
};

export const updateTeam = async (id, organizationId, data) => {
  await getTeam(id, organizationId);
  return prisma.team.update({ where: { id }, data: { name: data.name, description: data.description } });
};

export const deleteTeam = async (id, organizationId) => {
  await getTeam(id, organizationId);
  await prisma.team.delete({ where: { id } });
  return { message: 'Team deleted' };
};

export const addMember = async (teamId, organizationId, userId) => {
  await getTeam(teamId, organizationId);
  const member = await prisma.organizationMember.findFirst({ where: { organizationId, userId } });
  if (!member) throw new BadRequestError('User not in organization');
  try {
    await prisma.teamMember.create({ data: { teamId, userId } });
  } catch { throw new BadRequestError('Already a member'); }
  return getTeam(teamId, organizationId);
};

export const removeMember = async (teamId, organizationId, userId) => {
  await getTeam(teamId, organizationId);
  const del = await prisma.teamMember.deleteMany({ where: { teamId, userId } });
  if (!del.count) throw new NotFoundError('Member not in team');
  return getTeam(teamId, organizationId);
};
