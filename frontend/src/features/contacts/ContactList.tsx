import { useState } from 'react';
import { useGetContactsQuery, useCreateContactMutation, useUpdateContactMutation, useDeleteContactMutation, useGetContactQuery } from '../../api/crmApi.ts';
import { useGetCompaniesQuery } from '../../api/crmApi.ts';
import { Card, CardContent } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Search, Plus, Trash2, Edit, Eye, Building2, Mail, Phone, User, Briefcase, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  jobTitle: z.string().optional(),
});

export const ContactList = () => {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetContactsQuery({ search: search || undefined });
  const { data: viewData } = useGetContactQuery(viewingId!, { skip: !viewingId });
  const { data: companiesData } = useGetCompaniesQuery({});
  const [createContact, { isLoading: creating }] = useCreateContactMutation();
  const [updateContact, { isLoading: updating }] = useUpdateContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  const contacts = (data as any)?.data || [];
  const companies: any[] = (companiesData as any)?.data || [];
  const viewing = (viewData as any)?.data;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(contactSchema) });

  const openCreate = () => { reset({ firstName: '', lastName: '', email: '', phone: '', companyId: '', jobTitle: '' }); setShowCreate(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setValue('firstName', c.firstName); setValue('lastName', c.lastName || ''); setValue('email', c.email || ''); setValue('phone', c.phone || ''); setValue('companyId', c.companyId || ''); setValue('jobTitle', c.jobTitle || '');
    setShowCreate(true);
  };
  const onSubmit = async (d: any) => {
    const payload = { firstName: d.firstName, lastName: d.lastName || undefined, email: d.email || undefined, phone: d.phone || undefined, companyId: d.companyId || undefined, jobTitle: d.jobTitle || undefined };
    if (editing) { await updateContact({ id: editing.id, ...payload }).unwrap(); setEditing(null); }
    else { await createContact(payload).unwrap(); }
    reset(); setShowCreate(false);
  };
  const handleDelete = async () => { if (deleteId) { await deleteContact(deleteId).unwrap(); setDeleteId(null); } };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">{contacts.length} contacts • Click a card to view details</p>
        </div>
        <Button onClick={openCreate} className="h-10 px-5 rounded-xl bg-slate-900 text-white"><Plus className="w-4 h-4 mr-2" /> New Contact</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9 bg-white h-10 rounded-xl" />
        </div>
        {search && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSearch('')}><X className="w-4 h-4" /> Clear</Button>}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setEditing(null); }}>
        <DialogContent onClose={() => { setShowCreate(false); setEditing(null); }} className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Contact' : 'New Contact'}</DialogTitle>
            <DialogDescription>{editing ? 'Update contact information.' : 'Add a new contact to your workspace.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>First Name *</Label><Input {...register('firstName')} placeholder="Jane" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.firstName && <p className="text-xs text-red-600 mt-1">{(errors.firstName as any).message}</p>}</div>
              <div><Label>Last Name</Label><Input {...register('lastName')} placeholder="Doe" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
              <div><Label>Email</Label><Input {...register('email')} placeholder="jane@acme.com" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.email && <p className="text-xs text-red-600 mt-1">{(errors.email as any).message}</p>}</div>
              <div><Label>Phone</Label><Input {...register('phone')} placeholder="+1 555..." className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
              <div><Label>Company</Label>
                <select {...register('companyId')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm">
                  <option value="">No company</option>
                  {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label>Job Title</Label><Input {...register('jobTitle')} placeholder="Marketing Manager" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
              <Button type="submit" disabled={creating || updating} className="rounded-xl bg-slate-900 text-white px-6">{creating || updating ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewingId} onOpenChange={(o) => !o && setViewingId(null)}>
        <DialogContent onClose={() => setViewingId(null)} className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><User className="w-5 h-5" /> {viewing?.firstName} {viewing?.lastName}</DialogTitle>
            <DialogDescription>Contact details and timeline</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Email</div><div className="font-medium flex items-center gap-1.5"><Mail className="w-3 h-3" />{viewing.email || '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Phone</div><div className="font-medium flex items-center gap-1.5"><Phone className="w-3 h-3" />{viewing.phone || '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Company</div><div className="font-medium flex items-center gap-1.5"><Building2 className="w-3 h-3" />{viewing.company?.name || '—'}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Job Title</div><div className="font-medium flex items-center gap-1.5"><Briefcase className="w-3 h-3" />{viewing.jobTitle || '—'}</div></div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Recent Activity</h4>
                {viewing.activities?.length ? viewing.activities.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="text-sm p-2 rounded-lg bg-slate-50 border mb-1.5"><div className="font-medium text-xs">{a.type} • {a.title || 'Activity'}</div><div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</div></div>
                )) : <p className="text-sm text-slate-500">No recent activity.</p>}
              </div>
              <div className="flex justify-end"><Button variant="outline" className="rounded-xl" onClick={() => setViewingId(null)}>Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)} className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
            <DialogDescription>This will archive the contact. You can restore it later from admin.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : contacts.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mx-auto mb-3"><User className="w-6 h-6 text-slate-400" /></div>
          <div className="font-semibold">No contacts yet</div><p className="text-sm text-slate-500 mt-1">Convert a lead or create a contact manually.</p>
          <Button onClick={openCreate} className="mt-4 rounded-xl bg-slate-900 text-white">New Contact</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c: any) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow bg-white overflow-hidden group">
              <div className="h-1 w-full bg-slate-900" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold shrink-0">{c.firstName[0]}{c.lastName?.[0] || ''}</div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{c.firstName} {c.lastName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Briefcase className="w-3 h-3" />{c.jobTitle || 'No title'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{c.email || '—'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{c.company?.name || 'No company'}</div>
                    </div>
                  </div>
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
