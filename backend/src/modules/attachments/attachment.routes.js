import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { presignSchema, confirmSchema, listAttachmentSchema } from './attachment.schema.js';
import * as attachmentController from './attachment.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);

router.get('/', authorize('attachments:read', 'leads:read'), validate(listAttachmentSchema), attachmentController.list);
router.post('/presign', authorize('attachments:create'), validate(presignSchema), attachmentController.presign);
router.post('/confirm', authorize('attachments:create'), validate(confirmSchema), attachmentController.confirm);
router.get('/:id/download', authorize('attachments:read'), attachmentController.download);
router.delete('/:id', authorize('attachments:delete'), attachmentController.remove);

export default router;
