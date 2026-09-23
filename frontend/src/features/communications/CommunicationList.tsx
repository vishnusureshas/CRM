import { useState } from 'react';
import { useGetCommunicationsQuery, useSendCommunicationMutation } from '../../api/filesApi.ts';
import { Card, CardContent } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Mail, Send, Search, Clock, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ recipient: z.string().email('Valid email required'), subject: z.string().min(1, 'Subject required'), body: z.string().min(1, 'Body required'), relatedEntityType: z.string().optional(), relatedEntityId: z.string().optional() });

export const CommunicationList = () => {
  const [search, setSearch] = useState('');
  const [showSend, setShowSend] = useState(false);
  const { data, isLoading } = useGetCommunicationsQuery({ search: search || undefined });
  const [sendEmail, { isLoading: sending }] = useSendCommunicationMutation();
  const emails = (data as any)?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSend = async (fd: any) => {
    await sendEmail({ recipient: fd.recipient, subject: fd.subject, body: fd.body, relatedEntityType: fd.relatedEntityType || undefined, relatedEntityId: fd.relatedEntityId || undefined }).unwrap();
    reset(); setShowSend(false);
  };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Mail className="w-6 h-6" /> Communications</h1>
          <p className="text-sm text-slate-500 mt-1">{emails.length} emails • Sent via EmailLog (SENT immediately, queued in prod)</p>
        </div>
        <Button onClick={() => setShowSend(true)} className="h-10 px-5 rounded-xl bg-slate-900 text-white"><Send className="w-4 h-4 mr-2" /> Send Email</Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by recipient or subject..." className="pl-9 bg-white h-10 rounded-xl" />
      </div>

      <Dialog open={showSend} onOpenChange={setShowSend}>
        <DialogContent onClose={() => setShowSend(false)} className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>Compose an email — it will be logged as SENT and linked to an entity optionally.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSend)} className="space-y-4 p-6 pt-0">
            <div><Label>Recipient Email *</Label><Input {...register('recipient')} placeholder="customer@acme.com" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.recipient && <p className="text-xs text-red-600 mt-1">{(errors.recipient as any).message}</p>}</div>
            <div><Label>Subject *</Label><Input {...register('subject')} placeholder="Follow up on your inquiry" className="mt-1.5 h-11 bg-slate-50 rounded-xl" />{errors.subject && <p className="text-xs text-red-600 mt-1">{(errors.subject as any).message}</p>}</div>
            <div><Label>Message *</Label><textarea {...register('body')} placeholder="Hi there, ..." rows={4} className="mt-1.5 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm" />{errors.body && <p className="text-xs text-red-600 mt-1">{(errors.body as any).message}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Related Type</Label><select {...register('relatedEntityType')} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm"><option value="">None</option><option value="LEAD">Lead</option><option value="CONTACT">Contact</option><option value="COMPANY">Company</option><option value="DEAL">Deal</option></select></div>
              <div><Label>Related ID</Label><Input {...register('relatedEntityId')} placeholder="cuid (optional)" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowSend(false)}>Cancel</Button>
              <Button type="submit" disabled={sending} className="rounded-xl bg-slate-900 text-white px-6">{sending ? 'Sending...' : 'Send'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div> : emails.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mx-auto mb-3"><Mail className="w-6 h-6 text-slate-400" /></div>
          <div className="font-semibold">No emails yet</div><p className="text-sm text-slate-500 mt-1">Send your first email to a customer.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {emails.map((e: any) => (
            <Card key={e.id} className="hover:shadow-md transition-shadow bg-white overflow-hidden">
              <div className="h-1 w-full bg-slate-900" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Mail className="w-5 h-5" /></div>
                    <div>
                      <div className="font-semibold text-sm">{e.subject}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{e.sender} → {e.recipient}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(e.createdAt).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${e.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50'}`}>{e.status}</span>
                      </div>
                      <div className="text-sm text-slate-700 mt-2 line-clamp-2 bg-slate-50 border rounded-xl p-3">{e.body}</div>
                      {(e.relatedEntityType || e.relatedEntityId) && <div className="text-xs text-slate-500 mt-2">Linked: {e.relatedEntityType} • <span className="mono bg-slate-100 px-1 rounded">{e.relatedEntityId?.slice(0, 8)}…</span></div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
