import { z } from 'zod';

export const salesReportSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    pipelineId: z.string().optional(),
    format: z.enum(['json', 'csv']).optional().default('json'),
  }),
});

export const leadsReportSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURING', 'UNQUALIFIED', 'CONVERTED', 'LOST']).optional(),
    format: z.enum(['json', 'csv']).optional().default('json'),
  }),
});

export const activitiesReportSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    entityType: z.string().optional(),
    format: z.enum(['json', 'csv']).optional().default('json'),
  }),
});
