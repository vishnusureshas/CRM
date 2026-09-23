import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createRoleSchema, updateRoleSchema } from './role.schema.js';
import * as roleController from './role.controller.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', authorize('roles:read', 'admin:read'), roleController.list);
router.get('/:id', authorize('roles:read', 'admin:read'), roleController.get);
router.post('/', authorize('roles:create', 'admin:read'), validate(createRoleSchema), roleController.create);
router.patch('/:id', authorize('roles:update', 'admin:read'), validate(updateRoleSchema), roleController.update);
router.delete('/:id', authorize('roles:delete', 'admin:read'), roleController.remove);

export default router;
