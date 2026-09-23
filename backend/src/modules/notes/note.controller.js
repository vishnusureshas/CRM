import * as noteService from './note.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
export const list = async (req, res, next) => { try { const { data, pagination } = await noteService.listNotes(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Notes fetched'); } catch (e) { next(e); } };
export const create = async (req, res, next) => { try { const d = await noteService.createNote(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Note created', d); } catch (e) { next(e); } };
export const remove = async (req, res, next) => { try { const d = await noteService.deleteNote(req.params.id, req.user.organizationId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
