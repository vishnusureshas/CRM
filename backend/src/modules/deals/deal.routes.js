import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createDealSchema, updateDealSchema, listDealSchema, moveStageSchema, closeDealSchema } from './deal.schema.js';
import * as dealController from './deal.controller.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', authorize('deals:read'), validate(listDealSchema), dealController.list);
router.post('/', authorize('deals:create'), validate(createDealSchema), dealController.create);
router.get('/:id', authorize('deals:read'), dealController.get);
router.patch('/:id', authorize('deals:update'), validate(updateDealSchema), dealController.update);
router.delete('/:id', authorize('deals:delete'), dealController.remove);
router.post('/:id/move-stage', authorize('deals:update'), validate(moveStageSchema), dealController.moveStage);
router.post('/:id/close', authorize('deals:update', 'deals:close'), validate(closeDealSchema), dealController.close);

export default router;
