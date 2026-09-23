import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createOrganizationSchema, updateOrganizationSchema } from './organization.schema.js';
import * as orgController from './organization.controller.js';

const router = Router();

// My org (any authenticated member)
router.get('/me', authenticate, requireOrganization, orgController.getMe);
router.patch('/me', authenticate, requireOrganization, authorize('organizations:update', 'admin:read'), validate(updateOrganizationSchema), orgController.update);

// Admin: manage all orgs — require suspended org check bypass via separate auth
router.get('/', authenticate, authorize('organizations:read', 'admin:read'), orgController.list);
router.post('/', authenticate, authorize('organizations:create', 'admin:read'), validate(createOrganizationSchema), orgController.create);
router.get('/:id', authenticate, authorize('organizations:read', 'admin:read'), orgController.get);
router.patch('/:id', authenticate, authorize('organizations:update', 'admin:read'), validate(updateOrganizationSchema), orgController.update);
router.post('/:id/suspend', authenticate, authorize('organizations:update', 'admin:read'), orgController.suspend);
router.post('/:id/activate', authenticate, authorize('organizations:update', 'admin:read'), orgController.activate);

export default router;
