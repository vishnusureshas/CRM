import prisma from '../../config/db.js';
import { sendSuccess } from '../../utils/response.js';

export const listPermissions = async (req, res, next) => {
  try {
    const perms = await prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
    return sendSuccess(res, 200, 'Permissions fetched', perms);
  } catch (err) { next(err); }
};
