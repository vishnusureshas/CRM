import { baseApi } from './baseApi.ts';

export const crmApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Leads
    getLeads: b.query<any, any>({ query: (params) => ({ url: '/leads', params }), providesTags: ['Lead'] }),
    getLead: b.query({ query: (id: string) => `/leads/${id}`, providesTags: (_r: any, _e: any, id: any) => [{ type: 'Lead', id }] }),
    createLead: b.mutation({ query: (body) => ({ url: '/leads', method: 'POST', body }), invalidatesTags: ['Lead'] }),
    updateLead: b.mutation({ query: ({ id, ...body }: any) => ({ url: `/leads/${id}`, method: 'PATCH', body }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Lead', id: arg.id }, 'Lead'] }),
    deleteLead: b.mutation({ query: (id: string) => ({ url: `/leads/${id}`, method: 'DELETE' }), invalidatesTags: ['Lead'] }),
    convertLead: b.mutation({ query: ({ id, ...body }: any) => ({ url: `/leads/${id}/convert`, method: 'POST', body }), invalidatesTags: ['Lead', 'Contact', 'Company'] }),
    // Contacts
    getContacts: b.query({ query: (params) => ({ url: '/contacts', params }), providesTags: ['Contact'] }),
    getContact: b.query({ query: (id: string) => `/contacts/${id}`, providesTags: (_r: any, _e: any, id: any) => [{ type: 'Contact', id }] }),
    createContact: b.mutation({ query: (body) => ({ url: '/contacts', method: 'POST', body }), invalidatesTags: ['Contact'] }),
    updateContact: b.mutation({ query: ({ id, ...body }: any) => ({ url: `/contacts/${id}`, method: 'PATCH', body }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Contact', id: arg.id }, 'Contact'] }),
    deleteContact: b.mutation({ query: (id: string) => ({ url: `/contacts/${id}`, method: 'DELETE' }), invalidatesTags: ['Contact'] }),
    // Companies
    getCompanies: b.query({ query: (params) => ({ url: '/companies', params }), providesTags: ['Company'] }),
    getCompany: b.query({ query: (id: string) => `/companies/${id}`, providesTags: (_r: any, _e: any, id: any) => [{ type: 'Company', id }] }),
    createCompany: b.mutation({ query: (body) => ({ url: '/companies', method: 'POST', body }), invalidatesTags: ['Company'] }),
    updateCompany: b.mutation({ query: ({ id, ...body }: any) => ({ url: `/companies/${id}`, method: 'PATCH', body }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Company', id: arg.id }, 'Company'] }),
    deleteCompany: b.mutation({ query: (id: string) => ({ url: `/companies/${id}`, method: 'DELETE' }), invalidatesTags: ['Company'] }),
    // Tasks
    getTasks: b.query({ query: (params) => ({ url: '/tasks', params }), providesTags: ['Task'] }),
    getTask: b.query({ query: (id: string) => `/tasks/${id}`, providesTags: (_r: any, _e: any, id: any) => [{ type: 'Task', id }] }),
    createTask: b.mutation({ query: (body) => ({ url: '/tasks', method: 'POST', body }), invalidatesTags: ['Task'] }),
    updateTask: b.mutation({ query: ({ id, ...body }: any) => ({ url: `/tasks/${id}`, method: 'PATCH', body }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Task', id: arg.id }, 'Task'] }),
    deleteTask: b.mutation({ query: (id: string) => ({ url: `/tasks/${id}`, method: 'DELETE' }), invalidatesTags: ['Task'] }),
    completeTask: b.mutation({ query: (id: string) => ({ url: `/tasks/${id}/complete`, method: 'POST' }), invalidatesTags: ['Task'] }),
    // Activities & Notes
    getActivities: b.query({ query: (params) => ({ url: '/activities', params }), providesTags: ['Activity'] }),
    createActivity: b.mutation({ query: (body) => ({ url: '/activities', method: 'POST', body }), invalidatesTags: ['Activity'] }),
    getNotes: b.query({ query: (params) => ({ url: '/notes', params }), providesTags: ['Note'] }),
    createNote: b.mutation({ query: (body) => ({ url: '/notes', method: 'POST', body }), invalidatesTags: ['Note'] }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useConvertLeadMutation,
  useGetContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetCompaniesQuery,
  useGetCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCompleteTaskMutation,
  useGetActivitiesQuery,
  useCreateActivityMutation,
  useGetNotesQuery,
  useCreateNoteMutation,
} = crmApi;
