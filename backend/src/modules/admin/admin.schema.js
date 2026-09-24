import { z } from 'zod';

export const updateOrgStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']) }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']) }),
});

export const listAuditSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ROLE_CHANGE', 'EXPORT', 'IMPORT', 'RESTORE']).optional(),
    resource: z.string().optional(),
    organizationId: z.string().optional(),
    userId: z.string().optional(),
  }),
});

export const listAdminUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    search: z.string().optional(),
  }),
});

export const listAdminOrgsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
    search: z.string().optional(),
  }),
});
