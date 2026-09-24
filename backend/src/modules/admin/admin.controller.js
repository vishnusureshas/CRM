import * as adminService from './admin.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const dashboard = async (_req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    return sendSuccess(res, 200, 'Admin dashboard fetched', data);
  } catch (e) { next(e); }
};

export const listUsers = async (req, res, next) => {
  try {
    const { data, pagination } = await adminService.listUsers(req.query);
    return sendPaginated(res, data, pagination, 'Users fetched');
  } catch (e) { next(e); }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const data = await adminService.updateUserStatus(req.params.id, req.body.status, req.user.userId);
    return sendSuccess(res, 200, 'User status updated', data);
  } catch (e) { next(e); }
};

export const listOrgs = async (req, res, next) => {
  try {
    const { data, pagination } = await adminService.listOrgs(req.query);
    return sendPaginated(res, data, pagination, 'Organizations fetched');
  } catch (e) { next(e); }
};

export const updateOrgStatus = async (req, res, next) => {
  try {
    const data = await adminService.updateOrgStatus(req.params.id, req.body.status, req.user.userId);
    return sendSuccess(res, 200, 'Organization status updated', data);
  } catch (e) { next(e); }
};

export const listAuditLogs = async (req, res, next) => {
  try {
    const { data, pagination } = await adminService.listAuditLogs(req.query);
    return sendPaginated(res, data, pagination, 'Audit logs fetched');
  } catch (e) { next(e); }
};
