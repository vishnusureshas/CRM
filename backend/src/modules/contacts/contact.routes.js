import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createContactSchema, updateContactSchema } from './contact.schema.js';
import * as contactController from './contact.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);
router.get('/', authorize('contacts:read'), contactController.list);
router.post('/', authorize('contacts:create'), validate(createContactSchema), contactController.create);
router.get('/:id', authorize('contacts:read'), contactController.get);
router.patch('/:id', authorize('contacts:update'), validate(updateContactSchema), contactController.update);
router.delete('/:id', authorize('contacts:delete'), contactController.remove);
export default router;
