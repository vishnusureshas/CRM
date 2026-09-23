import { ForbiddenError } from '../utils/errors.js';
import * as permissionService from '../services/permission.service.js';

// requirePermission("leads:create")
// Supports multiple: authorize("leads:read", "contacts:read") → must have at least one
export const authorize = (...permissions) => {
  return async (req, _res, next) => {
    if (!req.user) return next(new ForbiddenError('Not authenticated'));
    if (permissions.length === 0) return next();

    const { userId, organizationId } = req.user;
    if (!organizationId) return next(new ForbiddenError('Missing organization context'));

    try {
      // Check each required permission; if any passes, allow
      for (const perm of permissions) {
        const has = await permissionService.hasPermission(userId, organizationId, perm);
        if (has) return next();
      }
      return next(new ForbiddenError(`Missing permission: ${permissions.join(' or ')}`));
    } catch (err) {
      return next(err);
    }
  };
};

export const requirePermission = (permission) => authorize(permission);

// Require org-level role slug (e.g., super_admin, admin)
export const requireRole = (...roles) => {
  return async (req, _res, next) => {
    if (!req.user) return next(new ForbiddenError('Not authenticated'));
    // role is in JWT; verify against DB for freshness
    if (roles.includes(req.user.role)) return next();
    // fallback DB check
    try {
      const perms = await permissionService.getUserPermissions(req.user.userId, req.user.organizationId);
      // super_admin bypass
      if (perms.includes('admin:read') && roles.includes('admin')) return next();
      return next(new ForbiddenError(`Requires role: ${roles.join(' or ')}`));
    } catch (err) { return next(err); }
  };
};
