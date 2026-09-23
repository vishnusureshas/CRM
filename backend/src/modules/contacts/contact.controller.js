import * as contactService from './contact.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const list = async (req, res, next) => { try { const { data, pagination } = await contactService.listContacts(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Contacts fetched'); } catch (e) { next(e); } };
export const get = async (req, res, next) => { try { const d = await contactService.getContact(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Contact fetched', d); } catch (e) { next(e); } };
export const create = async (req, res, next) => { try { const d = await contactService.createContact(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Contact created', d); } catch (e) { next(e); } };
export const update = async (req, res, next) => { try { const d = await contactService.updateContact(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Contact updated', d); } catch (e) { next(e); } };
export const remove = async (req, res, next) => { try { const d = await contactService.deleteContact(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
