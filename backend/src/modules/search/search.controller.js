import * as searchService from './search.service.js';
import { sendSuccess } from '../../utils/response.js';

export const search = async (req, res, next) => {
  try {
    const data = await searchService.globalSearch(req.user.organizationId, req.query.q, Number(req.query.limit) || 5);
    return sendSuccess(res, 200, 'Search results', data);
  } catch (e) { next(e); }
};
