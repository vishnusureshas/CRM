import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.use(authenticate, requireOrganization);

// Single grouped response per BACKEND.md §75 - not N+1
router.get('/', dashboardController.get);

export default router;
