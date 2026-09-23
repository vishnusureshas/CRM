import { z } from 'zod';
export const createCompanySchema = z.object({ body: z.object({ name: z.string().min(1).max(100), website: z.string().url().optional().or(z.literal('')), industry: z.string().max(100).optional() }) });
export const updateCompanySchema = z.object({ body: z.object({ name: z.string().min(1).max(100).optional(), website: z.string().url().optional().or(z.literal('')), industry: z.string().max(100).optional() }), params: z.object({ id: z.string().cuid() }) });
