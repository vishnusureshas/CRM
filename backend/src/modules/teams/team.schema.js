import { z } from 'zod';

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    memberIds: z.array(z.string().cuid()).optional(),
  }),
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const manageMemberSchema = z.object({
  body: z.object({ userId: z.string().cuid() }),
  params: z.object({ id: z.string().cuid() }),
});
