import * as leadService from './lead.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try { const { data, pagination } = await leadService.listLeads(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Leads fetched'); } catch (e) { next(e); }
};
export const get = async (req, res, next) => {
  try { const d = await leadService.getLead(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Lead fetched', d); } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { const d = await leadService.createLead(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Lead created successfully', d); } catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { const d = await leadService.updateLead(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Lead updated', d); } catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { const d = await leadService.deleteLead(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); }
};
export const assign = async (req, res, next) => {
  try { const d = await leadService.assignLead(req.params.id, req.user.organizationId, req.body.ownerId, req.user.userId); return sendSuccess(res, 200, 'Lead assigned', d); } catch (e) { next(e); }
};
export const convert = async (req, res, next) => {
  try { const d = await leadService.convertLead(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Lead converted successfully', d); } catch (e) { next(e); }
};
