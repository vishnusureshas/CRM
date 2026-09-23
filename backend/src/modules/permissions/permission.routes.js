import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import * as permissionController from './permission.controller.js';

const router = Router();

router.use(authenticate, requireOrganization);

// Any member can list permissions; stricter check for mutation would be roles:read
router.get('/', authorize('roles:read', 'admin:read'), permissionController.listPermissions);

export default router;
