import * as dealService from './deal.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try { const { data, pagination } = await dealService.listDeals(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Deals fetched'); } catch (e) { next(e); }
};
export const get = async (req, res, next) => {
  try { const d = await dealService.getDeal(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Deal fetched', d); } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { const d = await dealService.createDeal(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Deal created', d); } catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { const d = await dealService.updateDeal(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Deal updated', d); } catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { const d = await dealService.deleteDeal(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); }
};
export const moveStage = async (req, res, next) => {
  try { const d = await dealService.moveDealStage(req.params.id, req.user.organizationId, req.user.userId, req.body.stageId); return sendSuccess(res, 200, 'Deal stage moved', d); } catch (e) { next(e); }
};
export const close = async (req, res, next) => {
  try { const d = await dealService.closeDeal(req.params.id, req.user.organizationId, req.user.userId, req.body.status); return sendSuccess(res, 200, `Deal ${req.body.status}`, d); } catch (e) { next(e); }
};
