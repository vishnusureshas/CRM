import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice.ts';

/**
 * Backend JWT payload role is `admin | super_admin | sales_manager | sales_rep | support_agent | viewer`
 * Frontend mirrors it: user.role?.slug, user.role, or decoded token role.
 * Falls back to JWT decode if Redux user has no role (e.g., after refresh).
 */
const decodeRole = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role || null;
  } catch {
    return null;
  }
};

export const useRole = (): string => {
  const user = useSelector(selectCurrentUser) as any;
  const raw = (() => {
    try { return JSON.parse(localStorage.getItem('crm_auth') || '{}'); } catch { return {}; }
  })();
  const tokenRole = decodeRole(raw?.accessToken || null);
  const role: string = (user?.role?.slug || user?.role || tokenRole || 'sales_rep') as string;
  return role;
};

export const rolePermissions: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['*'],
  sales_manager: ['leads:*', 'contacts:*', 'companies:*', 'deals:*', 'pipelines:*', 'tasks:*', 'activities:*', 'notifications:*', 'reports:*'],
  sales_rep: ['leads:read', 'leads:create', 'leads:update', 'contacts:read', 'contacts:create', 'companies:read', 'deals:read', 'pipelines:read', 'tasks:*'],
  support_agent: ['contacts:read', 'companies:read', 'tasks:*', 'activities:*', 'notifications:*'],
  viewer: ['leads:read', 'contacts:read', 'companies:read', 'deals:read', 'pipelines:read', 'tasks:read', 'notifications:read'],
};

export const hasPerm = (role: string, required: string): boolean => {
  if (role === 'super_admin' || role === 'admin') return true;
  const perms = rolePermissions[role] || [];
  if (perms.includes('*')) return true;
  if (perms.includes(required)) return true;
  const [res] = required.split(':');
  if (perms.includes(`${res}:*`)) return true;
  return false;
};
