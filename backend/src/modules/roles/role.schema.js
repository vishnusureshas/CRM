import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/, 'Slug must be lowercase alphanumeric + underscore').optional(),
    description: z.string().max(255).optional(),
    permissionIds: z.array(z.string().cuid()).optional(),
    permissionSlugs: z.array(z.string()).optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().max(255).optional(),
    permissionIds: z.array(z.string().cuid()).optional(),
    permissionSlugs: z.array(z.string()).optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});
