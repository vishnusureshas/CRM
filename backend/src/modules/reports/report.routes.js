import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { salesReportSchema, leadsReportSchema, activitiesReportSchema } from './report.schema.js';
import * as reportController from './report.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);

router.get('/sales', authorize('reports:read', 'deals:read'), validate(salesReportSchema), reportController.sales);
router.get('/leads', authorize('reports:read', 'leads:read'), validate(leadsReportSchema), reportController.leads);
router.get('/activities', authorize('reports:read'), validate(activitiesReportSchema), reportController.activities);

export default router;
