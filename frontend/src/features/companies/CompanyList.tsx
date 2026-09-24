import { useState } from 'react';
import { useGetCompaniesQuery, useCreateCompanyMutation, useUpdateCompanyMutation, useDeleteCompanyMutation, useGetCompanyQuery } from '../../api/crmApi.ts';
import { Card, CardContent } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Plus, Building2, Globe, Mail, Phone, Users, Briefcase, Trash2, Edit, Eye, Search, X } from 'lucide-react';
import { Can } from '../../components/common/RequireRole.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(1, 'Name is required'), website: z.string().url().optional().or(z.literal('')), email: z.string().email().optional().or(z.literal('')), phone: z.string().optional(), industry: z.string().optional() });

export const CompanyList = () => {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetCompaniesQuery({ search: search || undefined });
  const { data: viewData } = useGetCompanyQuery(viewingId!, { skip: !viewingId });
  const [createCompany, { isLoading: creating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();

  const companies = (data as any)?.data || [];
  const viewing = (viewData as any)?.data;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const openCreate = () => { reset({ name: '', website: '', email: '', phone: '', industry: '' }); setShowCreate(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setValue('name', c.name); setValue('website', c.website || ''); setValue('email', c.email || ''); setValue('phone', c.phone || ''); setValue('industry', c.industry || '');
    setShowCreate(true);
  };
  const onSubmit = async (d: any) => {
    const payload = { name: d.name, website: d.website || undefined, email: d.email || undefined, phone: d.phone || undefined, industry: d.industry || undefined };
    if (editing) await updateCompany({ id: editing.id, ...payload }).unwrap();
    else await createCompany(payload).unwrap();
    reset(); setShowCreate(false); setEditing(null);
  };
  const handleDelete = async () => { if (deleteId) { await deleteCompany(deleteId).unwrap(); setDeleteId(null); } };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-slate-500 mt-1">{companies.length} companies • Click a card to view details</p>
        </div>
        <Can perm="companies:create"><Button onClick={openCreate} className="h-10 px-5 rounded-xl bg-slate-900 text-white"><Plus className="w-4 h-4 mr-2" /> New Company</Button></Can>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="pl-9 bg-white h-10 rounded-xl" />
        </div>
        {search && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSearch('')}><X className="w-4 h-4" /> Clear</Button>}
      </div>

      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setEditing(null); }}>
        <DialogContent onClose={() => { setShowCreate(false); setEditing(null); }} className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Company' : 'New Company'}</DialogTitle>
            <DialogDescription>{editing ? 'Update company details.' : 'Add a new company to your workspace.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
            <div><Label>Name *</Label><Input {...register('name')} placeholder="Acme Inc" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.name && <p className="text-xs text-red-600 mt-1">{(errors.name as any).message}</p>}</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Website</Label><Input {...register('website')} placeholder="https://acme.com" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.website && <p className="text-xs text-red-600 mt-1">{(errors.website as any).message}</p>}</div>
              <div><Label>Email</Label><Input {...register('email')} placeholder="hello@acme.com" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.email && <p className="text-xs text-red-600 mt-1">{(errors.email as any).message}</p>}</div>
              <div><Label>Phone</Label><Input {...register('phone')} placeholder="+1 555..." className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
              <div><Label>Industry</Label><Input {...register('industry')} placeholder="Technology" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
              <Button type="submit" disabled={creating || updating} className="rounded-xl bg-slate-900 text-white px-6">{creating || updating ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingId} onOpenChange={(o) => !o && setViewingId(null)}>
        <DialogContent onClose={() => setViewingId(null)} className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> {viewing?.name}</DialogTitle>
            <DialogDescription>Company details</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Website</div><div className="font-medium flex items-center gap-1"><Globe className="w-3 h-3" />{viewing.website || '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Email</div><div className="font-medium flex items-center gap-1"><Mail className="w-3 h-3" />{viewing.email || '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Phone</div><div className="font-medium flex items-center gap-1"><Phone className="w-3 h-3" />{viewing.phone || '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Industry</div><div className="font-medium">{viewing.industry || '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Contacts</div><div className="font-medium flex items-center gap-1"><Users className="w-3 h-3" />{viewing.contacts?.length || 0}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Deals</div><div className="font-medium flex items-center gap-1"><Briefcase className="w-3 h-3" />{viewing.deals?.length || 0}</div></div>
              </div>
              <div className="flex justify-end"><Button variant="outline" className="rounded-xl" onClick={() => setViewingId(null)}>Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)} className="max-w-[400px]">
          <DialogHeader><DialogTitle>Delete company?</DialogTitle><DialogDescription>This will archive the company.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : companies.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mx-auto mb-3"><Building2 className="w-6 h-6 text-slate-400" /></div>
          <div className="font-semibold">No companies yet</div><p className="text-sm text-slate-500 mt-1">Create a company or convert a lead.</p>
          <Can perm="companies:create"><Button onClick={openCreate} className="mt-4 rounded-xl bg-slate-900 text-white">New Company</Button></Can>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c: any) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow bg-white overflow-hidden group">
              <div className="h-1 w-full bg-slate-900" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 border">{c.industry || 'No industry'}</span>
                </div>
                <div className="font-semibold mt-3 truncate">{c.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Globe className="w-3 h-3" />{c.website || '—'}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email || '—'}</div>
                <div className="flex gap-2 mt-3 text-xs text-slate-500">
                  <span className="px-2 py-1 rounded-full bg-slate-50 border flex items-center gap-1"><Users className="w-3 h-3" />{c.contacts?.length ?? 0} contacts</span>
                  <span className="px-2 py-1 rounded-full bg-slate-50 border flex items-center gap-1"><Briefcase className="w-3 h-3" />{c.deals?.length ?? 0} deals</span>
                </div>
                <div className="flex gap-1.5 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs" onClick={() => setViewingId(c.id)}><Eye className="w-3 h-3 mr-1" /> View</Button>
                  <Button size="sm" variant="ghost" className="rounded-xl h-8 w-8 p-0" onClick={() => openEdit(c)}><Edit className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
