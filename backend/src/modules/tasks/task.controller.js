import * as taskService from './task.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
export const list = async (req, res, next) => { try { const { data, pagination } = await taskService.listTasks(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Tasks fetched'); } catch (e) { next(e); } };
export const get = async (req, res, next) => { try { const d = await taskService.getTask(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Task fetched', d); } catch (e) { next(e); } };
export const create = async (req, res, next) => { try { const d = await taskService.createTask(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Task created', d); } catch (e) { next(e); } };
export const update = async (req, res, next) => { try { const d = await taskService.updateTask(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Task updated', d); } catch (e) { next(e); } };
export const remove = async (req, res, next) => { try { const d = await taskService.deleteTask(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
export const complete = async (req, res, next) => { try { const d = await taskService.completeTask(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, 'Task completed', d); } catch (e) { next(e); } };
