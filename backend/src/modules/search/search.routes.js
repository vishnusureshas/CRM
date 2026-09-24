import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireOrganization } from '../../middleware/requireOrganization.js';
import { validate } from '../../middleware/validate.js';
import { searchSchema } from './search.schema.js';
import * as searchController from './search.controller.js';

const router = Router();
router.use(authenticate, requireOrganization);
router.get('/', validate(searchSchema), searchController.search);
export default router;
