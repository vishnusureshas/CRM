import { baseApi } from './baseApi.ts';

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }), invalidatesTags: ['Auth'] }),
    login: b.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }), invalidatesTags: ['Auth'] }),
    getMe: b.query({ query: () => '/auth/me', providesTags: ['Auth'] }),
    logout: b.mutation({ query: () => ({ url: '/auth/logout', method: 'POST' }), invalidatesTags: ['Auth'] }),
    forgotPassword: b.mutation({ query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }) }),
    resetPassword: b.mutation({ query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }) }),
    changePassword: b.mutation({ query: (body) => ({ url: '/auth/change-password', method: 'PATCH', body }) }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
