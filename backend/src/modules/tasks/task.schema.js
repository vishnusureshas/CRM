import { z } from 'zod';
const priorityEnum = z.enum(['LOW','MEDIUM','HIGH','URGENT']);
const statusEnum = z.enum(['TODO','IN_PROGRESS','COMPLETED','CANCELLED']);
export const createTaskSchema = z.object({ body: z.object({ title: z.string().min(1).max(200), description: z.string().max(5000).optional(), priority: priorityEnum.optional().default('MEDIUM'), status: statusEnum.optional().default('TODO'), dueDate: z.string().optional(), assignedTo: z.string().cuid().optional(), relatedLeadId: z.string().cuid().optional(), relatedDealId: z.string().cuid().optional() }) });
export const updateTaskSchema = z.object({ body: z.object({ title: z.string().min(1).max(200).optional(), description: z.string().max(5000).optional(), priority: priorityEnum.optional(), status: statusEnum.optional(), dueDate: z.string().optional(), assignedTo: z.string().cuid().optional().nullable() }), params: z.object({ id: z.string().cuid() }) });
