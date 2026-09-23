import * as roleService from './role.service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await roleService.listRoles(req.user.organizationId);
    return sendSuccess(res, 200, 'Roles fetched', data);
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const data = await roleService.getRole(req.params.id, req.user.organizationId);
    return sendSuccess(res, 200, 'Role fetched', data);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await roleService.createRole(req.user.organizationId, req.body);
    return sendSuccess(res, 201, 'Role created', data);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = await roleService.updateRole(req.params.id, req.user.organizationId, req.body);
    return sendSuccess(res, 200, 'Role updated', data);
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const data = await roleService.deleteRole(req.params.id, req.user.organizationId);
    return sendSuccess(res, 200, data.message, null);
  } catch (err) { next(err); }
};
