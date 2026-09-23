import { z } from 'zod';
export const createNoteSchema = z.object({ body: z.object({ content: z.string().min(1).max(10000), entityType: z.enum(['LEAD','CONTACT','COMPANY','DEAL']), entityId: z.string().cuid() }) });
