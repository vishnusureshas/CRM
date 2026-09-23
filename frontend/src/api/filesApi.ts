import { baseApi } from './baseApi.ts';

export const filesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Attachments
    getAttachments: b.query<any, any>({ query: (params) => ({ url: '/attachments', params }), providesTags: ['Attachment'] }),
    presignAttachment: b.mutation<any, any>({ query: (body) => ({ url: '/attachments/presign', method: 'POST', body }) }),
    confirmAttachment: b.mutation<any, any>({ query: (body) => ({ url: '/attachments/confirm', method: 'POST', body }), invalidatesTags: ['Attachment'] }),
    downloadAttachment: b.query<any, string>({ query: (id) => `/attachments/${id}/download` }),
    deleteAttachment: b.mutation<any, string>({ query: (id) => ({ url: `/attachments/${id}`, method: 'DELETE' }), invalidatesTags: ['Attachment'] }),

    // Communications
    getCommunications: b.query<any, any>({ query: (params) => ({ url: '/communications', params }), providesTags: ['Communication'] }),
    sendCommunication: b.mutation<any, any>({ query: (body) => ({ url: '/communications/send', method: 'POST', body }), invalidatesTags: ['Communication'] }),

    // Notifications
    getNotifications: b.query<any, any>({ query: (params) => ({ url: '/notifications', params }), providesTags: ['Notification'] }),
    createNotification: b.mutation<any, any>({ query: (body) => ({ url: '/notifications', method: 'POST', body }), invalidatesTags: ['Notification'] }),
    markNotificationRead: b.mutation<any, string>({ query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Notification'] }),
    markAllNotificationsRead: b.mutation<any, void>({ query: () => ({ url: '/notifications/read-all', method: 'PATCH' }), invalidatesTags: ['Notification'] }),
    deleteNotification: b.mutation<any, string>({ query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }), invalidatesTags: ['Notification'] }),
  }),
});

export const {
  useGetAttachmentsQuery,
  usePresignAttachmentMutation,
  useConfirmAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetCommunicationsQuery,
  useSendCommunicationMutation,
  useGetNotificationsQuery,
  useCreateNotificationMutation,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = filesApi;
