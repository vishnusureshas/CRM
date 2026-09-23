import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createTeamSchema, updateTeamSchema, manageMemberSchema } from './team.schema.js';
import * as teamController from './team.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);

router.get('/', authorize('users:read', 'admin:read'), teamController.list);
router.get('/:id', authorize('users:read', 'admin:read'), teamController.get);
router.post('/', authorize('users:create', 'admin:read'), validate(createTeamSchema), teamController.create);
router.patch('/:id', authorize('users:update', 'admin:read'), validate(updateTeamSchema), teamController.update);
router.delete('/:id', authorize('users:delete', 'admin:read'), teamController.remove);
router.post('/:id/members', authorize('users:update', 'admin:read'), validate(manageMemberSchema), teamController.addMember);
router.delete('/:id/members/:userId', authorize('users:update', 'admin:read'), teamController.removeMember);

export default router;
