import * as notifService from './notification.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const list = async (req, res, next) => { try { const { data, pagination, unreadCount } = await notifService.listNotifications(req.user.userId, req.query); return res.json({ success: true, message: 'Notifications fetched', data, pagination, unreadCount }); } catch (e) { next(e); } };
export const create = async (req, res, next) => { try { const d = await notifService.createNotification(req.user.userId, req.body); return sendSuccess(res, 201, 'Notification created', d); } catch (e) { next(e); } };
export const markRead = async (req, res, next) => { try { const d = await notifService.markRead(req.params.id, req.user.userId); return sendSuccess(res, 200, 'Marked read', d); } catch (e) { next(e); } };
export const markAllRead = async (req, res, next) => { try { const d = await notifService.markAllRead(req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
export const remove = async (req, res, next) => { try { const d = await notifService.removeNotification(req.params.id, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
