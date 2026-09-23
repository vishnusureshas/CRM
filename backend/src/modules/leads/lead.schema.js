import { z } from 'zod';

const leadSourceEnum = z.enum(['WEBSITE','REFERRAL','LINKEDIN','FACEBOOK','INSTAGRAM','GOOGLE','ADVERTISEMENT','COLD_CALL','EMAIL','EVENT','OTHER']);
const leadStatusEnum = z.enum(['NEW','CONTACTED','QUALIFIED','NURTURING','UNQUALIFIED','CONVERTED','LOST']);

export const createLeadSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name required').max(100),
    lastName: z.string().max(100).optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    companyName: z.string().max(100).optional(),
    jobTitle: z.string().max(100).optional(),
    source: leadSourceEnum.optional().default('OTHER'),
    status: leadStatusEnum.optional().default('NEW'),
    rating: z.string().max(20).optional(),
    ownerId: z.string().cuid().optional(),
    teamId: z.string().cuid().optional(),
    description: z.string().max(5000).optional(),
    address: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    website: z.string().url().optional().or(z.literal('')),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    companyName: z.string().max(100).optional(),
    jobTitle: z.string().max(100).optional(),
    source: leadSourceEnum.optional(),
    status: leadStatusEnum.optional(),
    rating: z.string().max(20).optional(),
    ownerId: z.string().cuid().optional().nullable(),
    teamId: z.string().cuid().optional().nullable(),
    description: z.string().max(5000).optional(),
    address: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    website: z.string().url().optional().or(z.literal('')),
  }),
  params: z.object({ id: z.string().cuid() }),
});

export const listLeadSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: leadStatusEnum.optional(),
    source: leadSourceEnum.optional(),
    ownerId: z.string().cuid().optional(),
    teamId: z.string().cuid().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc','desc']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

export const convertLeadSchema = z.object({
  body: z.object({
    createDeal: z.boolean().optional().default(false),
    deal: z.object({
      name: z.string().min(2).max(100).optional(),
      amount: z.coerce.number().positive().optional(),
      pipelineId: z.string().cuid().optional(),
      stageId: z.string().cuid().optional(),
      expectedCloseDate: z.string().optional(),
    }).optional(),
  }),
  params: z.object({ id: z.string().cuid() }),
});
