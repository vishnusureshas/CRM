import { z } from 'zod';

export const createNotificationSchema = z.object({
  body: z.object({
    type: z.enum(['TASK_ASSIGNED', 'TASK_DUE', 'LEAD_ASSIGNED', 'DEAL_UPDATED', 'DEAL_WON', 'DEAL_LOST', 'MENTION', 'SYSTEM']),
    title: z.string().min(1).max(200),
    message: z.string().max(1000).optional(),
    entityType: z.string().max(50).optional(),
    entityId: z.string().cuid().optional(),
    userId: z.string().cuid().optional(),
  }),
});

export const listNotificationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isRead: z.enum(['true', 'false']).optional(),
    type: z.string().optional(),
  }),
});
