import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema, listUserSchema } from './user.schema.js';
import * as userController from './user.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);

router.get('/', authorize('users:read', 'admin:read'), validate(listUserSchema), userController.list);
router.get('/:id', authorize('users:read', 'admin:read'), userController.get);
router.post('/', authorize('users:create', 'admin:read'), validate(createUserSchema), userController.create);
router.patch('/:id', authorize('users:update', 'admin:read'), validate(updateUserSchema), userController.update);
router.delete('/:id', authorize('users:delete', 'admin:read'), userController.remove);

export default router;
