import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout.tsx';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { ProtectedRoute, PublicOnly } from '../components/common/ProtectedRoute.tsx';
import { Login } from '../features/auth/Login.tsx';
import { Register } from '../features/auth/Register.tsx';
import { ForgotPassword } from '../features/auth/ForgotPassword.tsx';
import { Dashboard } from '../features/dashboard/Dashboard.tsx';
import { RolesPage, UsersPage, TeamsPage } from '../features/rbac/RbacPages.tsx';
import { LeadList } from '../features/leads/LeadList.tsx';
import { ContactList } from '../features/contacts/ContactList.tsx';
import { CompanyList } from '../features/companies/CompanyList.tsx';
import { TaskList } from '../features/tasks/TaskList.tsx';
import { DealKanban } from '../features/deals/DealKanban.tsx';
import { PipelineList } from '../features/pipelines/PipelineList.tsx';
import { AttachmentList } from '../features/attachments/AttachmentList.tsx';
import { CommunicationList } from '../features/communications/CommunicationList.tsx';
import { NotificationCenter } from '../features/notifications/NotificationCenter.tsx';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <PublicOnly><Login /></PublicOnly> },
      { path: '/register', element: <PublicOnly><Register /></PublicOnly> },
      { path: '/forgot-password', element: <PublicOnly><ForgotPassword /></PublicOnly> },
    ],
  },
  {
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/leads', element: <LeadList /> },
      { path: '/contacts', element: <ContactList /> },
      { path: '/companies', element: <CompanyList /> },
      { path: '/deals', element: <DealKanban /> },
      { path: '/pipelines', element: <PipelineList /> },
      { path: '/tasks', element: <TaskList /> },
      { path: '/attachments', element: <AttachmentList /> },
      { path: '/communications', element: <CommunicationList /> },
      { path: '/notifications', element: <NotificationCenter /> },
      { path: '/users', element: <UsersPage /> },
      { path: '/roles', element: <RolesPage /> },
      { path: '/teams', element: <TeamsPage /> },
      { path: '/organizations', element: <div className="text-sm text-muted-foreground">Organizations — Phase 3: admin only, see backend /api/v1/organizations</div> },
      { path: '/settings/pipelines', element: <PipelineList /> },
    ],
  },
  { path: '*', element: <div className="p-8 text-center">404 — Not found</div> },
]);
