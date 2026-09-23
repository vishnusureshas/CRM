import { z } from 'zod';
const typeEnum = z.enum(['CALL','EMAIL','MEETING','NOTE','TASK','WHATSAPP','SMS','OTHER','STATUS_CHANGED','ASSIGNMENT']);
export const createActivitySchema = z.object({ body: z.object({ type: typeEnum, title: z.string().max(200).optional(), description: z.string().max(5000).optional(), entityType: z.enum(['LEAD','CONTACT','COMPANY','DEAL']), entityId: z.string().cuid(), metadata: z.any().optional() }) });
