import { z } from 'zod';

const dealStatusEnum = z.enum(['OPEN', 'WON', 'LOST']);

export const createDealSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name required').max(150),
    companyId: z.string().cuid().optional().nullable(),
    contactId: z.string().cuid().optional().nullable(),
    ownerId: z.string().cuid().optional().nullable(),
    pipelineId: z.string().cuid('Pipeline required'),
    stageId: z.string().cuid('Stage required'),
    amount: z.coerce.number().min(0, 'Amount must be >= 0'),
    currency: z.string().max(10).optional().default('USD'),
    probability: z.coerce.number().int().min(0).max(100).optional().default(0),
    expectedCloseDate: z.string().optional().nullable(),
    status: dealStatusEnum.optional().default('OPEN'),
    source: z.string().max(50).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
  }),
});

export const updateDealSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    companyId: z.string().cuid().optional().nullable(),
    contactId: z.string().cuid().optional().nullable(),
    ownerId: z.string().cuid().optional().nullable(),
    pipelineId: z.string().cuid().optional(),
    stageId: z.string().cuid().optional(),
    amount: z.coerce.number().min(0).optional(),
    currency: z.string().max(10).optional(),
    probability: z.coerce.number().int().min(0).max(100).optional(),
    expectedCloseDate: z.string().optional().nullable(),
    status: dealStatusEnum.optional(),
    source: z.string().max(50).optional().nullable(),
    description: z.string().max(5000).optional().nullable(),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const listDealSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: dealStatusEnum.optional(),
    pipelineId: z.string().cuid().optional(),
    stageId: z.string().cuid().optional(),
    ownerId: z.string().cuid().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

export const moveStageSchema = z.object({
  body: z.object({
    stageId: z.string().cuid('stageId required'),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const closeDealSchema = z.object({
  body: z.object({
    status: z.enum(['WON', 'LOST']),
  }),
  params: z.object({ id: z.string().cuid() }),
});
