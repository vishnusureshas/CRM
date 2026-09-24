import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateOrgStatusSchema, updateUserStatusSchema, listAuditSchema, listAdminUsersSchema, listAdminOrgsSchema } from './admin.schema.js';
import * as adminController from './admin.controller.js';

const router = Router();

// All admin routes require auth + org + admin:read
router.use(authenticate, requireOrganization, authorize('admin:read'));

router.get('/dashboard', adminController.dashboard);
router.get('/users', validate(listAdminUsersSchema), adminController.listUsers);
router.patch('/users/:id/status', validate(updateUserStatusSchema), adminController.updateUserStatus);
router.get('/organizations', validate(listAdminOrgsSchema), adminController.listOrgs);
router.patch('/organizations/:id/status', validate(updateOrgStatusSchema), adminController.updateOrgStatus);
router.get('/audit-logs', validate(listAuditSchema), adminController.listAuditLogs);

export default router;
