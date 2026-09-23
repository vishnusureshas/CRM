import * as activityService from './activity.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
export const list = async (req, res, next) => { try { const { data, pagination } = await activityService.listActivities(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Activities fetched'); } catch (e) { next(e); } };
export const create = async (req, res, next) => { try { const d = await activityService.createActivity(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Activity created', d); } catch (e) { next(e); } };
export const get = async (req, res, next) => { try { const d = await activityService.getActivity(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Activity fetched', d); } catch (e) { next(e); } };
