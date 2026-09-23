import * as orgService from './organization.service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try { const data = await orgService.listOrganizations(); return sendSuccess(res, 200, 'Organizations fetched', data); } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try { const data = await orgService.getOrganization(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Organization fetched', data); } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try { const data = await orgService.getMyOrganization(req.user.organizationId); return sendSuccess(res, 200, 'Organization fetched', data); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try { const data = await orgService.createOrganization(req.body, req.user.userId); return sendSuccess(res, 201, 'Organization created', data); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try { const data = await orgService.updateOrganization(req.params.id || req.user.organizationId, req.body); return sendSuccess(res, 200, 'Organization updated', data); } catch (err) { next(err); }
};

export const suspend = async (req, res, next) => {
  try { const data = await orgService.setStatus(req.params.id, 'SUSPENDED'); return sendSuccess(res, 200, 'Organization suspended', data); } catch (err) { next(err); }
};

export const activate = async (req, res, next) => {
  try { const data = await orgService.setStatus(req.params.id, 'ACTIVE'); return sendSuccess(res, 200, 'Organization activated', data); } catch (err) { next(err); }
};
