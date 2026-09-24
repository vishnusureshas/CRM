import { baseApi } from './baseApi.ts';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getAdminDashboard: b.query<any, void>({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),
    getAdminUsers: b.query<any, any>({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['User'],
    }),
    updateAdminUserStatus: b.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/admin/users/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['User'],
    }),
    getAdminOrgs: b.query<any, any>({
      query: (params) => ({ url: '/admin/organizations', params }),
      providesTags: ['Organization'],
    }),
    suspendOrg: b.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/admin/organizations/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Organization'],
    }),
    getAuditLogs: b.query<any, any>({
      query: (params) => ({ url: '/admin/audit-logs', params }),
      providesTags: ['Activity'],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminUsersQuery,
  useUpdateAdminUserStatusMutation,
  useGetAdminOrgsQuery,
  useSuspendOrgMutation,
  useGetAuditLogsQuery,
} = adminApi;
