import { useState } from 'react';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation, useDeleteNotificationMutation, useCreateNotificationMutation } from '../../api/filesApi.ts';
import { Card, CardContent } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Bell, CheckCheck, Trash2, Plus, Clock, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const NotificationCenter = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, isError, error } = useGetNotificationsQuery({ isRead: filter === 'unread' ? 'false' : undefined });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();
  const [createNotif, { isLoading: creating }] = useCreateNotificationMutation();

  const notifs = (data as any)?.data || [];
  const unreadCount = (data as any)?.unreadCount ?? notifs.filter((n: any) => !n.isRead).length;
  const errStatus = (error as any)?.status;
  const isUnauthorized = errStatus === 401;

  const { register, handleSubmit, reset } = useForm();

  const onCreate = async (fd: any) => {
    await createNotif({ type: fd.type || 'SYSTEM', title: fd.title, message: fd.message || undefined }).unwrap();
    reset(); setShowCreate(false);
  };

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="w-6 h-6" /> Notifications <span className="text-sm font-normal px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">{unreadCount} unread</span></h1>
          <p className="text-sm text-slate-500 mt-1">In-app notifications — mark read, clear, or test create</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => markAllRead().unwrap()}><CheckCheck className="w-4 h-4 mr-1" /> Mark all read</Button>
          <Button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-xl bg-slate-900 text-white"><Plus className="w-4 h-4 mr-2" /> New</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'secondary' : 'outline'} size="sm" className="rounded-xl" onClick={() => setFilter('all')}>All ({(data as any)?.pagination?.total ?? notifs.length})</Button>
        <Button variant={filter === 'unread' ? 'secondary' : 'outline'} size="sm" className="rounded-xl" onClick={() => setFilter('unread')}>Unread ({unreadCount})</Button>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)} className="max-w-[480px]">
          <DialogHeader><DialogTitle>Create Notification</DialogTitle><DialogDescription>For testing — in prod these are created by task/deal events.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4 p-6 pt-0">
            <div><Label>Type</Label><select {...register('type')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm"><option value="SYSTEM">System</option><option value="TASK_ASSIGNED">Task Assigned</option><option value="TASK_DUE">Task Due</option><option value="LEAD_ASSIGNED">Lead Assigned</option><option value="DEAL_WON">Deal Won</option></select></div>
            <div><Label>Title *</Label><Input {...register('title', { required: true })} placeholder="Deal won! 🎉" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            <div><Label>Message</Label><Input {...register('message')} placeholder="Optional details" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="rounded-xl bg-slate-900 text-white px-6">{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isUnauthorized ? (
        <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-amber-800">Session expired</p>
          <p className="text-sm text-amber-700 mt-1">Please log in again to view notifications.</p>
          <Button className="mt-4 rounded-xl bg-slate-900 text-white" onClick={() => { localStorage.removeItem('crm_auth'); window.location.href = '/login'; }}>Go to Login</Button>
        </div>
      ) : isLoading ? <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div> : isError ? (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800">Failed to load notifications</p>
          <p className="text-sm text-red-600 mt-1">{(error as any)?.data?.message || 'Please try refreshing or logging in again.'}</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : notifs.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mx-auto mb-3"><Bell className="w-6 h-6 text-slate-400" /></div>
          <div className="font-semibold">No notifications</div><p className="text-sm text-slate-500 mt-1">{filter === 'unread' ? 'All caught up! No unread.' : 'You are all caught up.'}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifs.map((n: any) => (
            <Card key={n.id} className={`overflow-hidden border bg-white hover:shadow-md transition-shadow ${!n.isRead ? 'ring-1 ring-amber-200 bg-amber-50/30' : ''}`}>
              <div className={`h-1 w-full ${!n.isRead ? 'bg-amber-500' : 'bg-slate-200'}`} />
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}><Bell className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-2">{n.title} {!n.isRead && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500 text-white">New</span>} <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 border">{n.type}</span></div>
                  {n.message && <div className="text-sm text-slate-600 mt-1">{n.message}</div>}
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-2"><Clock className="w-3 h-3" />{new Date(n.createdAt).toLocaleString()} {n.entityType && <>• {n.entityType} <span className="mono bg-slate-100 px-1 rounded">{n.entityId?.slice(0, 8)}…</span></>}</div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!n.isRead && <Button size="sm" variant="outline" className="rounded-xl h-7 text-xs" onClick={() => markRead(n.id).unwrap()}><CheckCheck className="w-3 h-3 mr-1" /> Read</Button>}
                  <Button size="sm" variant="ghost" className="rounded-xl h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => deleteNotif(n.id).unwrap()}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> Notifications are in-app only — email channel queues via BullMQ in production.</p>
    </div>
  );
};
