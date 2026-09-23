import * as userService from './user.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try { const { data, pagination } = await userService.listUsers(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Users fetched'); } catch (e) { next(e); }
};
export const get = async (req, res, next) => {
  try { const d = await userService.getUser(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'User fetched', d); } catch (e) { next(e); }
};
export const create = async (req, res, next) => {
  try { const d = await userService.createUser(req.user.organizationId, req.body); return sendSuccess(res, 201, 'User created', d); } catch (e) { next(e); }
};
export const update = async (req, res, next) => {
  try { const d = await userService.updateUser(req.params.id, req.user.organizationId, req.body); return sendSuccess(res, 200, 'User updated', d); } catch (e) { next(e); }
};
export const remove = async (req, res, next) => {
  try { const d = await userService.removeUser(req.params.id, req.user.organizationId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); }
};
