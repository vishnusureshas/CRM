import { z } from 'zod';

export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'q is required').max(100),
    limit: z.coerce.number().int().min(1).max(20).optional().default(5),
  }),
});
