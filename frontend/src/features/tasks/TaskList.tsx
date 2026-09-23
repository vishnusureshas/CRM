import { useState } from 'react';
import { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useCompleteTaskMutation, useGetTaskQuery } from '../../api/crmApi.ts';
import { useGetUsersQuery } from '../../api/rbacApi.ts';
import { Card, CardContent } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Plus, CheckCircle2, Trash2, Edit, Eye, Clock, Flag, Calendar, User, Search, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskSchema = z.object({ title: z.string().min(1, 'Title is required'), description: z.string().optional(), priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(), status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(), dueDate: z.string().optional(), assignedTo: z.string().optional() });

const priorityColor: Record<string, string> = { LOW: 'bg-slate-100 text-slate-600 border-slate-200', MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200', HIGH: 'bg-amber-50 text-amber-700 border-amber-200', URGENT: 'bg-red-50 text-red-700 border-red-200' };

export const TaskList = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetTasksQuery({ search: search || undefined, status: filterStatus || undefined, priority: filterPriority || undefined });
  const { data: viewData } = useGetTaskQuery(viewingId!, { skip: !viewingId });
  const { data: usersData } = useGetUsersQuery({});
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [completeTask] = useCompleteTaskMutation();

  const tasks = (data as any)?.data || [];
  const users: any[] = (usersData as any)?.data || [];
  const viewing = (viewData as any)?.data;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(taskSchema) });

  const openCreate = () => { reset({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assignedTo: '' }); setShowCreate(true); };
  const openEdit = (t: any) => {
    setEditing(t);
    setValue('title', t.title); setValue('description', t.description || ''); setValue('priority', t.priority); setValue('status', t.status); setValue('dueDate', t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : ''); setValue('assignedTo', t.assignedTo || '');
    setShowCreate(true);
  };
  const onSubmit = async (d: any) => {
    const payload: any = { title: d.title, description: d.description || undefined, priority: d.priority || undefined, status: d.status || undefined, dueDate: d.dueDate || undefined, assignedTo: d.assignedTo || undefined };
    if (editing) await updateTask({ id: editing.id, ...payload }).unwrap();
    else await createTask(payload).unwrap();
    reset(); setShowCreate(false); setEditing(null);
  };
  const handleDelete = async () => { if (deleteId) { await deleteTask(deleteId).unwrap(); setDeleteId(null); } };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">{tasks.length} tasks • Track follow-ups and deadlines</p>
        </div>
        <Button onClick={openCreate} className="h-10 px-5 rounded-xl bg-slate-900 text-white"><Plus className="w-4 h-4 mr-2" /> New Task</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-9 bg-white h-10 rounded-xl" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm">
          <option value="">All status</option><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm">
          <option value="">All priority</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
        </select>
        {(search || filterStatus || filterPriority) && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}><X className="w-4 h-4" /> Clear</Button>}
      </div>

      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setEditing(null); }}>
        <DialogContent onClose={() => { setShowCreate(false); setEditing(null); }} className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>{editing ? 'Update task details.' : 'Create a new task and assign it.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
            <div><Label>Title *</Label><Input {...register('title')} placeholder="Call John about proposal" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.title && <p className="text-xs text-red-600 mt-1">{(errors.title as any).message}</p>}</div>
            <div><Label>Description</Label><Input {...register('description')} placeholder="Follow up details..." className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Priority</Label><select {...register('priority')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
              <div><Label>Status</Label><select {...register('status')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm"><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div>
              <div><Label>Due Date</Label><Input type="date" {...register('dueDate')} className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
              <div><Label>Assign To</Label>
                <select {...register('assignedTo')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm">
                  <option value="">Unassigned</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
              <Button type="submit" disabled={creating || updating} className="rounded-xl bg-slate-900 text-white px-6">{creating || updating ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingId} onOpenChange={(o) => !o && setViewingId(null)}>
        <DialogContent onClose={() => setViewingId(null)} className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> {viewing?.title}</DialogTitle>
            <DialogDescription>Task details</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="p-6 pt-0 space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Description</div><div className="font-medium">{viewing.description || '—'}</div></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Priority</div><span className={`text-xs px-2 py-1 rounded-full border ${priorityColor[viewing.priority]}`}>{viewing.priority}</span></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Status</div><span className="text-xs px-2 py-1 rounded-full bg-slate-100 border">{viewing.status}</span></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Due Date</div><div className="font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />{viewing.dueDate ? new Date(viewing.dueDate).toLocaleDateString() : '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Assignee</div><div className="font-medium flex items-center gap-1"><User className="w-3 h-3" />{viewing.assignedTo || 'Unassigned'}</div></div>
              </div>
              <div className="flex justify-end"><Button variant="outline" className="rounded-xl" onClick={() => setViewingId(null)}>Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)} className="max-w-[400px]">
          <DialogHeader><DialogTitle>Delete task?</DialogTitle><DialogDescription>This will archive the task.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mx-auto mb-3"><Clock className="w-6 h-6 text-slate-400" /></div>
          <div className="font-semibold">No tasks</div><p className="text-sm text-slate-500 mt-1">Create your first task to track follow-ups.</p>
          <Button onClick={openCreate} className="mt-4 rounded-xl bg-slate-900 text-white">New Task</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t: any) => (
            <Card key={t.id} className={`overflow-hidden border bg-white hover:shadow-md transition-shadow ${t.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
              <div className={`h-1 w-full ${t.priority === 'URGENT' ? 'bg-red-500' : t.priority === 'HIGH' ? 'bg-amber-500' : t.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-200'}`} />
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-1 h-12 rounded-full ${t.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm flex items-center gap-2 ${t.status === 'COMPLETED' ? 'line-through text-slate-500' : ''}`}>
                    {t.title} <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor[t.priority]}`}>{t.priority}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border flex items-center gap-1"><Flag className="w-3 h-3" />{t.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{t.assignedTo || 'Unassigned'}</span>
                  </div>
                  {t.description && <div className="text-xs text-slate-600 mt-1 line-clamp-1">{t.description}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0" onClick={() => setViewingId(t.id)}><Eye className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-xl h-8 w-8 p-0" onClick={() => openEdit(t)}><Edit className="w-3 h-3" /></Button>
                  {t.status !== 'COMPLETED' && <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs" onClick={async () => { await completeTask(t.id).unwrap(); }}><CheckCircle2 className="w-3 h-3 mr-1" />Done</Button>}
                  <Button size="sm" variant="ghost" className="rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
