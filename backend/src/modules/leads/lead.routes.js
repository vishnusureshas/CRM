import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createLeadSchema, updateLeadSchema, listLeadSchema, convertLeadSchema } from './lead.schema.js';
import * as leadController from './lead.controller.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', authorize('leads:read'), validate(listLeadSchema), leadController.list);
router.post('/', authorize('leads:create'), validate(createLeadSchema), leadController.create);
router.get('/:id', authorize('leads:read'), leadController.get);
router.patch('/:id', authorize('leads:update'), validate(updateLeadSchema), leadController.update);
router.delete('/:id', authorize('leads:delete'), leadController.remove);
router.post('/:id/assign', authorize('leads:update'), leadController.assign);
router.post('/:id/convert', authorize('leads:update'), validate(convertLeadSchema), leadController.convert);

export default router;
