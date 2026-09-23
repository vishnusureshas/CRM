import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { sendEmailSchema, listCommSchema } from './communication.schema.js';
import * as commController from './communication.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);

router.get('/', authorize('communications:read', 'leads:read'), validate(listCommSchema), commController.list);
router.post('/send', authorize('communications:create', 'leads:update'), validate(sendEmailSchema), commController.send);
router.get('/:id', authorize('communications:read'), commController.get);

export default router;
