import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createPipelineSchema,
  updatePipelineSchema,
  listPipelineSchema,
  createStageSchema,
  updateStageSchema,
  reorderStagesSchema,
  deleteStageSchema,
} from './pipeline.schema.js';
import * as pipelineController from './pipeline.controller.js';

const router = Router();

router.use(authenticate, requireOrganization);

router.get('/', authorize('pipelines:read', 'deals:read'), validate(listPipelineSchema), pipelineController.list);
router.post('/', authorize('pipelines:create'), validate(createPipelineSchema), pipelineController.create);
router.get('/:id', authorize('pipelines:read', 'deals:read'), pipelineController.get);
router.patch('/:id', authorize('pipelines:update'), validate(updatePipelineSchema), pipelineController.update);
router.delete('/:id', authorize('pipelines:delete'), pipelineController.remove);

// Stages
router.post('/:id/stages', authorize('pipelines:create', 'pipelines:update'), validate(createStageSchema), pipelineController.createStage);
router.patch('/:id/stages/reorder', authorize('pipelines:update'), validate(reorderStagesSchema), pipelineController.reorder);
router.patch('/:id/stages/:stageId', authorize('pipelines:update'), validate(updateStageSchema), pipelineController.updateStage);
router.delete('/:id/stages/:stageId', authorize('pipelines:delete', 'pipelines:update'), validate(deleteStageSchema), pipelineController.deleteStage);

export default router;
