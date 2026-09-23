import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug lowercase alphanumeric + hyphen').optional(),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    website: z.string().url().optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    website: z.string().url().optional().nullable(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
  }),
  params: z.object({ id: z.string().cuid().optional() }),
});
