import * as dashboardService from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';

export const get = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboard(req.user.organizationId, req.user.userId);
    return sendSuccess(res, 200, 'Dashboard fetched', data);
  } catch (e) { next(e); }
};
