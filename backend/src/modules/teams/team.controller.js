import * as teamService from './team.service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => { try { const d = await teamService.listTeams(req.user.organizationId); return sendSuccess(res, 200, 'Teams fetched', d); } catch (e) { next(e); } };
export const get = async (req, res, next) => { try { const d = await teamService.getTeam(req.params.id, req.user.organizationId); return sendSuccess(res, 200, 'Team fetched', d); } catch (e) { next(e); } };
export const create = async (req, res, next) => { try { const d = await teamService.createTeam(req.user.organizationId, req.body); return sendSuccess(res, 201, 'Team created', d); } catch (e) { next(e); } };
export const update = async (req, res, next) => { try { const d = await teamService.updateTeam(req.params.id, req.user.organizationId, req.body); return sendSuccess(res, 200, 'Team updated', d); } catch (e) { next(e); } };
export const remove = async (req, res, next) => { try { const d = await teamService.deleteTeam(req.params.id, req.user.organizationId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
export const addMember = async (req, res, next) => { try { const d = await teamService.addMember(req.params.id, req.user.organizationId, req.body.userId); return sendSuccess(res, 200, 'Member added', d); } catch (e) { next(e); } };
export const removeMember = async (req, res, next) => { try { const d = await teamService.removeMember(req.params.id, req.user.organizationId, req.params.userId); return sendSuccess(res, 200, 'Member removed', d); } catch (e) { next(e); } };
