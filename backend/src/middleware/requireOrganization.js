import prisma from '../config/db.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export const requireOrganization = async (req, _res, next) => {
  const { userId, organizationId } = req.user || {};
  if (!userId || !organizationId) return next(new UnauthorizedError('Missing authentication context'));

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId, organizationId },
      include: { organization: true },
    });
    if (!membership) return next(new ForbiddenError('Not a member of organization'));
    if (membership.organization.status !== 'ACTIVE') {
      return next(new ForbiddenError(`Organization is ${membership.organization.status}`));
    }
    req.membership = membership;
    req.organization = membership.organization;
    return next();
  } catch (err) {
    return next(err);
  }
};
