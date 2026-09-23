import { baseApi } from './baseApi.ts';

export const salesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Pipelines
    getPipelines: b.query<any, any>({ query: (params) => ({ url: '/pipelines', params }), providesTags: ['Pipeline'] }),
    getPipeline: b.query<any, string>({ query: (id) => `/pipelines/${id}`, providesTags: (_r: any, _e: any, id: any) => [{ type: 'Pipeline', id }] }),
    createPipeline: b.mutation<any, any>({ query: (body) => ({ url: '/pipelines', method: 'POST', body }), invalidatesTags: ['Pipeline', 'Dashboard'] }),
    updatePipeline: b.mutation<any, any>({ query: ({ id, ...body }: any) => ({ url: `/pipelines/${id}`, method: 'PATCH', body }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Pipeline', id: arg.id }, 'Pipeline', 'Dashboard'] }),
    deletePipeline: b.mutation<any, string>({ query: (id) => ({ url: `/pipelines/${id}`, method: 'DELETE' }), invalidatesTags: ['Pipeline', 'Dashboard'] }),
    createStage: b.mutation<any, any>({ query: ({ pipelineId, ...body }: any) => ({ url: `/pipelines/${pipelineId}/stages`, method: 'POST', body }), invalidatesTags: ['Pipeline', 'Dashboard'] }),
    updateStage: b.mutation<any, any>({ query: ({ pipelineId, stageId, ...body }: any) => ({ url: `/pipelines/${pipelineId}/stages/${stageId}`, method: 'PATCH', body }), invalidatesTags: ['Pipeline', 'Dashboard'] }),
    deleteStage: b.mutation<any, any>({ query: ({ pipelineId, stageId }: any) => ({ url: `/pipelines/${pipelineId}/stages/${stageId}`, method: 'DELETE' }), invalidatesTags: ['Pipeline', 'Dashboard'] }),
    reorderStages: b.mutation<any, any>({ query: ({ pipelineId, stages }: any) => ({ url: `/pipelines/${pipelineId}/stages/reorder`, method: 'PATCH', body: { stages } }), invalidatesTags: ['Pipeline', 'Dashboard'] }),
    // Deals
    getDeals: b.query<any, any>({ query: (params) => ({ url: '/deals', params }), providesTags: ['Deal'] }),
    getDeal: b.query<any, string>({ query: (id) => `/deals/${id}`, providesTags: (_r: any, _e: any, id: any) => [{ type: 'Deal', id }] }),
    createDeal: b.mutation<any, any>({ query: (body) => ({ url: '/deals', method: 'POST', body }), invalidatesTags: ['Deal', 'Dashboard'] }),
    updateDeal: b.mutation<any, any>({ query: ({ id, ...body }: any) => ({ url: `/deals/${id}`, method: 'PATCH', body }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Deal', id: arg.id }, 'Deal', 'Dashboard'] }),
    deleteDeal: b.mutation<any, string>({ query: (id) => ({ url: `/deals/${id}`, method: 'DELETE' }), invalidatesTags: ['Deal', 'Dashboard'] }),
    moveDealStage: b.mutation<any, any>({ query: ({ id, stageId }: any) => ({ url: `/deals/${id}/move-stage`, method: 'POST', body: { stageId } }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Deal', id: arg.id }, 'Deal', 'Dashboard'] }),
    closeDeal: b.mutation<any, any>({ query: ({ id, status }: any) => ({ url: `/deals/${id}/close`, method: 'POST', body: { status } }), invalidatesTags: (_r: any, _e: any, arg: any) => [{ type: 'Deal', id: arg.id }, 'Deal', 'Dashboard'] }),
    // Dashboard (grouped aggregates §75)
    getDashboard: b.query<any, void>({ query: () => '/dashboard', providesTags: ['Dashboard'] }),
  }),
});

export const {
  useGetPipelinesQuery,
  useGetPipelineQuery,
  useCreatePipelineMutation,
  useUpdatePipelineMutation,
  useDeletePipelineMutation,
  useCreateStageMutation,
  useUpdateStageMutation,
  useDeleteStageMutation,
  useReorderStagesMutation,
  useGetDealsQuery,
  useGetDealQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
  useMoveDealStageMutation,
  useCloseDealMutation,
  useGetDashboardQuery,
} = salesApi;
