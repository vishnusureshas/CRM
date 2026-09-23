import crypto from 'crypto';
import prisma from '../../config/db.js';
import { s3Client, isS3Enabled } from '../../config/s3.js';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'];
const MAX_SIZE = 10 * 1024 * 1024;

const inferMimeFromName = (name, provided) => {
  if (provided && ALLOWED_MIME.includes(provided) && provided !== 'application/octet-stream') return provided;
  const ext = name.split('.').pop()?.toLowerCase();
  const map = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', txt: 'text/plain', csv: 'text/csv', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  return map[ext] || provided || 'application/octet-stream';
};

const validateEntity = async (organizationId, entityType, entityId) => {
  const map = {
    LEAD: prisma.lead,
    CONTACT: prisma.contact,
    COMPANY: prisma.company,
    DEAL: prisma.deal,
    TASK: prisma.task,
    NOTE: prisma.note,
  };
  const model = map[entityType];
  if (!model) throw new BadRequestError('Invalid entityType');
  const exists = await model.findFirst({ where: { id: entityId, organizationId } });
  if (!exists) throw new NotFoundError(`${entityType} not found in organization`);
};

export const presign = async (orgId, userId, data) => {
  const mimeType = inferMimeFromName(data.originalName, data.mimeType);
  if (!ALLOWED_MIME.includes(mimeType)) throw new BadRequestError(`MIME not allowed: ${mimeType} (allowed: ${ALLOWED_MIME.join(', ')})`);
  if (data.size > MAX_SIZE) throw new BadRequestError('File too large — max 10MB');
  await validateEntity(orgId, data.entityType, data.entityId);
  // use inferred mime for storage
  data.mimeType = mimeType;
  const ext = data.originalName.split('.').pop() || 'bin';
  const storageKey = `${orgId}/${data.entityType.toLowerCase()}/${data.entityId}/${crypto.randomUUID()}.${ext}`;

  if (isS3Enabled()) {
    const post = await createPresignedPost(s3Client, {
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      Expires: 900,
      Conditions: [['content-length-range', 1, MAX_SIZE], ['starts-with', '$Content-Type', data.mimeType]],
      Fields: { 'Content-Type': data.mimeType },
    });
    return { storageKey, ...post, s3Enabled: true };
  }
  // Fallback: return storageKey for direct upload via POST /attachments (multer) or mock
  return { storageKey, url: `/api/v1/attachments/upload?key=${storageKey}`, s3Enabled: false, message: 'S3 not configured — use POST /attachments/upload or confirm directly' };
};

export const confirm = async (orgId, userId, data) => {
  await validateEntity(orgId, data.entityType, data.entityId);
  const attachment = await prisma.attachment.create({
    data: {
      organizationId: orgId,
      uploadedBy: userId,
      originalName: data.originalName,
      storageKey: data.storageKey,
      mimeType: data.mimeType,
      size: data.size,
      entityType: data.entityType,
      entityId: data.entityId,
    },
  });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'CREATE', resource: 'Attachment', resourceId: attachment.id, newValues: attachment } });
  return attachment;
};

export const listAttachments = async (orgId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const where = { organizationId: orgId };
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  const [data, total] = await Promise.all([
    prisma.attachment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.attachment.count({ where }),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

export const getDownloadUrl = async (id, orgId) => {
  const att = await prisma.attachment.findFirst({ where: { id, organizationId: orgId } });
  if (!att) throw new NotFoundError('Attachment not found');
  if (isS3Enabled()) {
    const cmd = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: att.storageKey });
    const url = await getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
    return { url, attachment: att };
  }
  // Fallback: return storageKey as pseudo-url
  return { url: `/api/v1/attachments/${id}/file`, attachment: att };
};

export const removeAttachment = async (id, orgId, userId) => {
  const att = await prisma.attachment.findFirst({ where: { id, organizationId: orgId } });
  if (!att) throw new NotFoundError('Attachment not found');
  await prisma.attachment.delete({ where: { id } });
  await prisma.auditLog.create({ data: { organizationId: orgId, userId, action: 'DELETE', resource: 'Attachment', resourceId: id } });
  return { message: 'Attachment deleted' };
};
