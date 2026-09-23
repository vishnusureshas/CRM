import * as attachmentService from './attachment.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export const presign = async (req, res, next) => { try { const d = await attachmentService.presign(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 200, 'Presigned URL generated', d); } catch (e) { next(e); } };
export const confirm = async (req, res, next) => { try { const d = await attachmentService.confirm(req.user.organizationId, req.user.userId, req.body); return sendSuccess(res, 201, 'Attachment confirmed', d); } catch (e) { next(e); } };
export const list = async (req, res, next) => { try { const { data, pagination } = await attachmentService.listAttachments(req.user.organizationId, req.query); return sendPaginated(res, data, pagination, 'Attachments fetched'); } catch (e) { next(e); } };
export const download = async (req, res, next) => {
  try {
    const { url, attachment } = await attachmentService.getDownloadUrl(req.params.id, req.user.organizationId);
    if (url.startsWith('http')) return res.redirect(302, url);
    return sendSuccess(res, 200, 'Download URL', { url, attachment });
  } catch (e) { next(e); }
};
export const remove = async (req, res, next) => { try { const d = await attachmentService.removeAttachment(req.params.id, req.user.organizationId, req.user.userId); return sendSuccess(res, 200, d.message, null); } catch (e) { next(e); } };
