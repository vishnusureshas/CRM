import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store.ts';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const isRefreshRequest = (args: any) => {
  const url = typeof args === 'string' ? args : args?.url;
  return url === '/auth/refresh' || url?.endsWith('/auth/refresh');
};
const baseQueryWithReauth: typeof baseQuery = async (args, api, extra) => {
  let result = await baseQuery(args, api, extra);
  if (result.error && (result.error as any).status === 401 && !isRefreshRequest(args)) {
    const refresh = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extra);
    if (refresh.data) {
      const data: any = refresh.data;
      // backend returns {success,data:{accessToken,user,organization}}
      if (data?.data?.accessToken) api.dispatch({ type: 'auth/setCredentials', payload: data.data });
      else if ((data as any)?.accessToken) api.dispatch({ type: 'auth/setCredentials', payload: data });
      result = await baseQuery(args, api, extra);
    } else {
      api.dispatch({ type: 'auth/logout' });
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User', 'Role', 'Permission', 'Organization', 'Team', 'Lead', 'Contact', 'Company', 'Task', 'Activity', 'Note', 'Deal', 'Pipeline', 'PipelineStage', 'Dashboard', 'Attachment', 'Communication', 'Notification'],
  endpoints: () => ({}),
});
