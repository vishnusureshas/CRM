import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { validate } from '../../middleware/validate.js';
import { createNotificationSchema, listNotificationSchema } from './notification.schema.js';
import * as notifController from './notification.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);

router.get('/', validate(listNotificationSchema), notifController.list);
router.post('/', validate(createNotificationSchema), notifController.create);
router.patch('/:id/read', notifController.markRead);
router.patch('/read-all', notifController.markAllRead);
router.delete('/:id', notifController.remove);

export default router;
