import { z } from 'zod';

export const presignSchema = z.object({
  body: z.object({
    originalName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    size: z.coerce.number().int().min(1).max(10 * 1024 * 1024),
    entityType: z.enum(['LEAD', 'CONTACT', 'COMPANY', 'DEAL', 'TASK', 'NOTE']),
    entityId: z.string().min(1, 'Entity ID is required'),
  }),
});

export const confirmSchema = z.object({
  body: z.object({
    storageKey: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.coerce.number().int().min(1),
    entityType: z.enum(['LEAD', 'CONTACT', 'COMPANY', 'DEAL', 'TASK', 'NOTE']),
    entityId: z.string().min(1, 'Entity ID is required'),
  }),
});

export const listAttachmentSchema = z.object({
  query: z.object({
    entityType: z.enum(['LEAD', 'CONTACT', 'COMPANY', 'DEAL', 'TASK', 'NOTE']).optional(),
    entityId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
