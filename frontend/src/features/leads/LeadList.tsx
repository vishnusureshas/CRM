import { useState } from 'react';
import { useGetLeadsQuery, useCreateLeadMutation, useDeleteLeadMutation, useConvertLeadMutation, useUpdateLeadMutation } from '../../api/crmApi.ts';
import { Card, CardContent } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Search, Plus, Trash2, ArrowRight, Filter, X, LayoutGrid, List, GripVertical, Briefcase, Mail, Building2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ firstName: z.string().min(1, 'Name is required'), lastName: z.string().optional(), email: z.string().email().optional().or(z.literal('')), companyName: z.string().optional(), phone: z.string().optional(), source: z.string().optional() });

const statuses: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'NEW', label: 'New', color: '#64748b', bg: 'bg-slate-50' },
  { id: 'CONTACTED', label: 'Contacted', color: '#3b82f6', bg: 'bg-blue-50' },
  { id: 'QUALIFIED', label: 'Qualified', color: '#8b5cf6', bg: 'bg-violet-50' },
  { id: 'NURTURING', label: 'Nurturing', color: '#f59e0b', bg: 'bg-amber-50' },
  { id: 'CONVERTED', label: 'Converted', color: '#10b981', bg: 'bg-emerald-50' },
  { id: 'LOST', label: 'Lost', color: '#ef4444', bg: 'bg-red-50' },
];

const statusColors: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700 border-slate-200',
  CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200',
  QUALIFIED: 'bg-violet-50 text-violet-700 border-violet-200',
  NURTURING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LOST: 'bg-red-50 text-red-700 border-red-200',
  UNQUALIFIED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const LeadList = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const { data, isLoading } = useGetLeadsQuery({ search: search || undefined, status: status || undefined, page: view === 'kanban' ? 1 : page, limit: view === 'kanban' ? 100 : 10 });
  const [createLead, { isLoading: creating }] = useCreateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [convertLead] = useConvertLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const leads = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;
  const [convertError, setConvertError] = useState<string | null>(null);

  const onCreate = async (formData: any) => {
    await createLead({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email || undefined, companyName: formData.companyName || undefined, phone: formData.phone || undefined, source: formData.source || 'OTHER' }).unwrap();
    reset(); setShowCreate(false);
  };

  const handleConvert = async (lead: any) => {
    setConvertError(null);
    try {
      await convertLead({ id: lead.id, createDeal: true, deal: { name: `${lead.firstName} Deal`, amount: 50000 } }).unwrap();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to convert lead';
      setConvertError(msg);
      // also catch 400 "No pipeline found" now fixed, but still show friendly message
      setTimeout(() => setConvertError(null), 4000);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    const lead = leads.find((l: any) => l.id === leadId);
    if (!lead || lead.status === newStatus) { setDraggedLead(null); setDragOverStatus(null); return; }
    if (lead.status === 'CONVERTED') return; // already converted
    try { await updateLead({ id: leadId, status: newStatus }).unwrap(); } catch (err: any) {
      const msg = err?.data?.message || 'Failed to update status';
      setConvertError(msg);
      setTimeout(() => setConvertError(null), 4000);
    }
    setDraggedLead(null); setDragOverStatus(null);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header — clean user-friendly */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">{leads.length} leads • Organize by stage • Drag to update status</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border bg-white p-1">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${view === 'kanban' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><LayoutGrid className="w-4 h-4" /> Kanban</button>
            <button onClick={() => setView('table')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${view === 'table' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><List className="w-4 h-4" /> List</button>
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-xl bg-slate-900 text-white"><Plus className="w-4 h-4 mr-2" /> New Lead</Button>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)} className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create Lead</DialogTitle>
            <DialogDescription>Add a new lead to your pipeline. You can move it across stages later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4 p-6 pt-0">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>First Name *</Label><Input {...register('firstName')} placeholder="John" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.firstName && <p className="text-xs text-red-600 mt-1">{(errors.firstName as any).message}</p>}</div>
              <div><Label>Last Name</Label><Input {...register('lastName')} placeholder="Doe" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
              <div><Label>Email</Label><Input {...register('email')} placeholder="john@acme.com" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.email && <p className="text-xs text-red-600 mt-1">{(errors.email as any).message}</p>}</div>
              <div><Label>Company</Label><Input {...register('companyName')} placeholder="Acme Inc" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
              <div><Label>Phone</Label><Input {...register('phone')} placeholder="+1 555..." className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
              <div><Label>Source</Label><select {...register('source')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm"><option value="WEBSITE">Website</option><option value="REFERRAL">Referral</option><option value="LINKEDIN">LinkedIn</option><option value="OTHER">Other</option></select></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="rounded-xl bg-slate-900 text-white px-6">{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Error banner */}
      {convertError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{convertError}</span>
          <button onClick={() => setConvertError(null)} className="ml-4 text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="pl-9 bg-white h-10 rounded-xl" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm min-w-[160px]">
          <option value="">All stages</option>
          {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {(search || status) && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setSearch(''); setStatus(''); }}><X className="w-4 h-4" /> Clear</Button>}
      </div>

      {/* Kanban */}
      {view === 'kanban' ? (
        isLoading ? (
          <div className="flex gap-4 overflow-hidden">{statuses.slice(0, 4).map((s) => <div key={s.id} className="w-[300px] h-[400px] bg-slate-100 rounded-xl animate-pulse shrink-0" />)}</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {statuses.map((col) => {
              const colLeads = leads.filter((l: any) => l.status === col.id);
              const isDragOver = dragOverStatus === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.id); }}
                  onDragLeave={() => setDragOverStatus(null)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`shrink-0 snap-start w-[300px] flex flex-col rounded-xl border overflow-hidden transition-colors ${isDragOver ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'bg-slate-50 border-slate-200'}`}
                  style={{ minHeight: '480px' }}
                >
                  <div className="bg-white border-b sticky top-0">
                    <div className="h-1 w-full" style={{ background: col.color }} />
                    <div className="p-4 flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />{col.label}</h3>
                      <span className="text-xs bg-slate-900 text-white px-2 py-1 rounded-full">{colLeads.length}</span>
                    </div>
                  </div>
                  <div className={`flex-1 p-3 space-y-3 overflow-y-auto ${isDragOver ? 'bg-violet-50/50' : ''}`}>
                    {colLeads.length === 0 ? (
                      <div className={`text-xs text-center py-8 border-2 border-dashed rounded-xl ${isDragOver ? 'border-violet-400 bg-white text-violet-700' : 'border-slate-300 bg-white text-slate-500'}`}>
                        <div className="font-medium">{isDragOver ? 'Drop here' : 'No leads'}</div>
                        <div className="text-xs mt-1">Drag a lead here</div>
                      </div>
                    ) : colLeads.map((l: any) => (
                      <div
                        key={l.id}
                        draggable={l.status !== 'CONVERTED'}
                        onDragStart={(e) => { setDraggedLead(l.id); e.dataTransfer.setData('text/plain', l.id); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => { setDraggedLead(null); setDragOverStatus(null); }}
                        className={`p-4 rounded-xl border bg-white cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedLead === l.id ? 'opacity-50 shadow-lg border-violet-300' : 'shadow-sm'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-sm truncate flex-1">{l.firstName} {l.lastName}</div>
                          <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" />{l.companyName || '— No company'}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{l.email ? <span className="truncate">{l.email}</span> : 'No email'}</div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColors[l.status]}`}>{l.status}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 border">{l.source}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t flex gap-1.5">
                          {l.status !== 'CONVERTED' && <Button size="sm" variant="outline" className="h-7 text-xs rounded-full flex-1" onClick={() => handleConvert(l)}><ArrowRight className="w-3 h-3 mr-1" /> Convert</Button>}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full" onClick={async () => { if (confirm('Delete lead?')) await deleteLead(l.id).unwrap(); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white border-t text-xs text-slate-500 flex items-center justify-between">
                    <span>{colLeads.length} leads</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {col.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Table view */
        <Card className="overflow-hidden border shadow-sm bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><Filter className="w-6 h-6 text-slate-400" /></div>
                <div className="font-medium">No leads yet</div><div className="text-sm text-slate-500">Create your first lead to start the pipeline.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b text-xs uppercase tracking-widest text-slate-500">
                    <tr><th className="text-left p-3 font-medium">Name</th><th className="text-left p-3 font-medium">Company</th><th className="text-left p-3 font-medium">Status</th><th className="text-left p-3 font-medium">Source</th><th className="text-left p-3 font-medium">Created</th><th className="text-right p-3 font-medium">Actions</th></tr>
                  </thead>
                  <tbody>
                    {leads.map((l: any) => (
                      <tr key={l.id} className="border-b hover:bg-slate-50">
                        <td className="p-3"><div className="font-medium">{l.firstName} {l.lastName}</div><div className="text-xs text-slate-500">{l.email || '—'}</div></td>
                        <td className="p-3 text-slate-500">{l.companyName || '—'}</td>
                        <td className="p-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${statusColors[l.status] || 'bg-slate-100'}`}>{l.status}</span></td>
                        <td className="p-3 text-xs">{l.source}</td>
                        <td className="p-3 text-xs text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            {l.status !== 'CONVERTED' && <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={() => handleConvert(l)}><ArrowRight className="w-3 h-3 mr-1" />Convert</Button>}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={async () => { if(confirm('Delete lead?')) await deleteLead(l.id).unwrap(); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pagination && pagination.totalPages > 1 && view === 'table' && (
              <div className="flex items-center justify-between p-3 border-t bg-slate-50 text-sm">
                <span className="text-slate-500">Page {pagination.page} of {pagination.totalPages} • {pagination.total} leads</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
        <Briefcase className="w-3 h-3" /> Tip: drag a lead card to another column to change its stage. Table view available as well.
      </p>
    </div>
  );
};
