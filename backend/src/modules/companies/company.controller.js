import * as companyService from './company.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
export const list = async (req, res, next) => { try { const { data, pagination } = await companyService.listCompanies(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Companies fetched'); } catch (e) { next(e); } };
export const get = async (req, res, next) => { try { const d = await companyService.getCompany(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Company fetched', d); } catch (e) { next(e); } };
export const create = async (req, res, next) => { try { const d = await companyService.createCompany(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Company created', d); } catch (e) { next(e); } };
export const update = async (req, res, next) => { try { const d = await companyService.updateCompany(req.params.id, req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Company updated', d); } catch (e) { next(e); } };
export const remove = async (req, res, next) => { try { const d = await companyService.deleteCompany(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
