import { Router } from 'express';
import authRoutes from '../../modules/auth/auth.routes.js';
import permissionRoutes from '../../modules/permissions/permission.routes.js';
import roleRoutes from '../../modules/roles/role.routes.js';
import organizationRoutes from '../../modules/organizations/organization.routes.js';
import teamRoutes from '../../modules/teams/team.routes.js';
import userRoutes from '../../modules/users/user.routes.js';
import leadRoutes from '../../modules/leads/lead.routes.js';
import contactRoutes from '../../modules/contacts/contact.routes.js';
import companyRoutes from '../../modules/companies/company.routes.js';
import taskRoutes from '../../modules/tasks/task.routes.js';
import activityRoutes from '../../modules/activities/activity.routes.js';
import noteRoutes from '../../modules/notes/note.routes.js';
import pipelineRoutes from '../../modules/pipelines/pipeline.routes.js';
import dealRoutes from '../../modules/deals/deal.routes.js';
import dashboardRoutes from '../../modules/dashboard/dashboard.routes.js';
import attachmentRoutes from '../../modules/attachments/attachment.routes.js';
import communicationRoutes from '../../modules/communications/communication.routes.js';
import notificationRoutes from '../../modules/notifications/notification.routes.js';
import adminRoutes from '../../modules/admin/admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/permissions', permissionRoutes);
router.use('/roles', roleRoutes);
router.use('/organizations', organizationRoutes);
router.use('/teams', teamRoutes);
router.use('/users', userRoutes);
router.use('/leads', leadRoutes);
router.use('/contacts', contactRoutes);
router.use('/companies', companyRoutes);
router.use('/tasks', taskRoutes);
router.use('/activities', activityRoutes);
router.use('/notes', noteRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/deals', dealRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/communications', communicationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Root — lists available modules
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'CRM API v1 — Phase 7 Admin ready',
    data: {
      version: 'v1',
      modules: ['auth', 'permissions', 'roles', 'organizations', 'teams', 'users', 'leads', 'contacts', 'companies', 'tasks', 'activities', 'notes', 'pipelines', 'deals', 'dashboard', 'attachments', 'communications', 'notifications', 'admin'],
      auth: [
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/refresh',
        'POST /api/v1/auth/logout',
        'GET  /api/v1/auth/me',
      ],
      rbac: [
        'GET /api/v1/permissions',
        'GET|POST /api/v1/roles',
        'GET /api/v1/organizations/me',
        'GET|POST /api/v1/teams',
        'GET|POST /api/v1/users',
      ],
      crm: [
        'GET|POST /api/v1/leads',
        'POST /api/v1/leads/:id/convert',
        'GET|POST /api/v1/contacts',
        'GET|POST /api/v1/companies',
        'GET|POST /api/v1/tasks',
        'GET|POST /api/v1/activities',
        'GET|POST /api/v1/notes',
      ],
      sales: [
        'GET|POST /api/v1/pipelines',
        'GET|PATCH|DELETE /api/v1/pipelines/:id',
        'POST /api/v1/pipelines/:id/stages',
        'PATCH /api/v1/pipelines/:id/stages/reorder',
        'GET|POST /api/v1/deals',
        'POST /api/v1/deals/:id/move-stage',
        'POST /api/v1/deals/:id/close',
        'GET /api/v1/dashboard',
      ],
      files: [
        'GET /api/v1/attachments?entityType=&entityId=',
        'POST /api/v1/attachments/presign',
        'POST /api/v1/attachments/confirm',
        'GET /api/v1/attachments/:id/download',
        'DELETE /api/v1/attachments/:id',
        'GET|POST /api/v1/communications',
        'POST /api/v1/communications/send',
        'GET|POST /api/v1/notifications',
        'PATCH /api/v1/notifications/:id/read',
        'PATCH /api/v1/notifications/read-all',
      ],
      admin: [
        'GET /api/v1/admin/dashboard',
        'GET /api/v1/admin/users?page=&limit=',
        'PATCH /api/v1/admin/users/:id/status',
        'GET /api/v1/admin/organizations',
        'PATCH /api/v1/admin/organizations/:id/status',
        'GET /api/v1/admin/audit-logs?page=&limit=',
      ],
      health: '/health',
    },
  });
});

export default router;
