import * as commService from './communication.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const send = async (req, res, next) => { try { const d = await commService.sendEmail(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Email sent', d); } catch (e) { next(e); } };
export const list = async (req, res, next) => { try { const { data, pagination } = await commService.listEmails(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Emails fetched'); } catch (e) { next(e); } };
export const get = async (req, res, next) => { try { const d = await commService.getEmail(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Email fetched', d); } catch (e) { next(e); } };
