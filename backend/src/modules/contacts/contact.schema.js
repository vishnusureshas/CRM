import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    companyId: z.string().cuid().optional().nullable(),
    jobTitle: z.string().max(100).optional(),
    ownerId: z.string().cuid().optional(),
  }),
});

export const updateContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    companyId: z.string().cuid().optional().nullable(),
    jobTitle: z.string().max(100).optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});
