import { baseApi } from './baseApi.ts';
export const searchApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    globalSearch: b.query<any, { q: string; limit?: number }>({ query: ({ q, limit = 5 }) => ({ url: '/search', params: { q, limit } }) }),
    getSalesReport: b.query<any, any>({ query: (p) => ({ url: '/reports/sales', params: p }) }),
    getLeadsReport: b.query<any, any>({ query: (p) => ({ url: '/reports/leads', params: p }) }),
    getActivitiesReport: b.query<any, any>({ query: (p) => ({ url: '/reports/activities', params: p }) }),
  }),
});
export const { useGlobalSearchQuery, useGetSalesReportQuery, useGetLeadsReportQuery, useGetActivitiesReportQuery } = searchApi;
