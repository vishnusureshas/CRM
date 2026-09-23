import { z } from 'zod';

export const createPipelineSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name required').max(100),
    description: z.string().max(500).optional().or(z.literal('')),
    isDefault: z.boolean().optional().default(false),
  }),
});

export const updatePipelineSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().or(z.literal('')),
    isDefault: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const listPipelineSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createStageSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    order: z.coerce.number().int().min(1).max(50),
    probability: z.coerce.number().int().min(0).max(100).optional().default(0),
    color: z.string().max(20).optional().or(z.literal('')),
    isClosed: z.boolean().optional().default(false),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const updateStageSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    order: z.coerce.number().int().min(1).max(50).optional(),
    probability: z.coerce.number().int().min(0).max(100).optional(),
    color: z.string().max(20).optional().or(z.literal('')),
    isClosed: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().cuid(), stageId: z.string().cuid() }),
});

export const reorderStagesSchema = z.object({
  body: z.object({
    stages: z.array(z.object({ id: z.string().cuid(), order: z.coerce.number().int().min(1) })).min(1),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const deleteStageSchema = z.object({
  params: z.object({ id: z.string().cuid(), stageId: z.string().cuid() }),
});
