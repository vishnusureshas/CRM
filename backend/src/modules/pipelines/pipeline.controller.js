import * as pipelineService from './pipeline.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try { const { data, pagination } = await pipelineService.listPipelines(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Pipelines fetched'); } catch (e) { next(e); }
};
export const get = async (req, res, next) => {
  try { const d = await pipelineService.getPipeline(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Pipeline fetched', d); } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { const d = await pipelineService.createPipeline(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Pipeline created', d); } catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { const d = await pipelineService.updatePipeline(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Pipeline updated', d); } catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { const d = await pipelineService.deletePipeline(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); }
};
export const createStage = async (req, res, next) => {
  try { const d = await pipelineService.createStage(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Stage created', d); } catch (e) { next(e); }
};
export const updateStage = async (req, res, next) => {
  try { const d = await pipelineService.updateStage(req.params.id, req.params.stageId, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Stage updated', d); } catch (e) { next(e); }
};
export const deleteStage = async (req, res, next) => {
  try { const d = await pipelineService.deleteStage(req.params.id, req.params.stageId, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); }
};
export const reorder = async (req, res, next) => {
  try { const d = await pipelineService.reorderStages(req.params.id, req.user.organizationId, req.user.userId, req.body.stages); return sendSuccess(res, 200, 'Stages reordered', d); } catch (e) { next(e); }
};
