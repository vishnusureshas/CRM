import { z } from 'zod';

export const sendEmailSchema = z.object({
  body: z.object({
    recipient: z.string().email(),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(10000),
    relatedEntityType: z.enum(['LEAD', 'CONTACT', 'COMPANY', 'DEAL']).optional(),
    relatedEntityId: z.string().cuid().optional(),
  }),
});

export const listCommSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.string().cuid().optional(),
    status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
  }),
});
