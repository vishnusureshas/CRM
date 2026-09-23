import { baseApi } from './baseApi.ts';

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPermissions: b.query({ query: () => '/permissions', providesTags: ['Permission'] }),
    getRoles: b.query({ query: () => '/roles', providesTags: ['Role'] }),
    createRole: b.mutation({ query: (body) => ({ url: '/roles', method: 'POST', body }), invalidatesTags: ['Role'] }),
    updateRole: b.mutation({ query: ({ id, ...body }: any) => ({ url: `/roles/${id}`, method: 'PATCH', body }), invalidatesTags: ['Role'] }),
    deleteRole: b.mutation({ query: (id: string) => ({ url: `/roles/${id}`, method: 'DELETE' }), invalidatesTags: ['Role'] }),
    getMyOrg: b.query({ query: () => '/organizations/me', providesTags: ['Organization'] }),
    getOrganizations: b.query({ query: () => '/organizations', providesTags: ['Organization'] }),
    getTeams: b.query({ query: () => '/teams', providesTags: ['Team'] }),
    createTeam: b.mutation({ query: (body) => ({ url: '/teams', method: 'POST', body }), invalidatesTags: ['Team'] }),
    getUsers: b.query({ query: (params) => ({ url: '/users', params }), providesTags: ['User'] }),
    createUser: b.mutation({ query: (body) => ({ url: '/users', method: 'POST', body }), invalidatesTags: ['User'] }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetMyOrgQuery,
  useGetOrganizationsQuery,
  useGetTeamsQuery,
  useCreateTeamMutation,
  useGetUsersQuery,
  useCreateUserMutation,
} = rbacApi;
