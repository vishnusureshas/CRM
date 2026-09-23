import { useState } from 'react';
import { useGetAttachmentsQuery, usePresignAttachmentMutation, useConfirmAttachmentMutation, useDeleteAttachmentMutation } from '../../api/filesApi.ts';
import { Card, CardContent } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog.tsx';
import { Upload, FileText, Trash2, Download, Filter, Paperclip, HardDrive } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const AttachmentList = () => {
  const [entityType, setEntityType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { data, isLoading, error: listError } = useGetAttachmentsQuery({ entityType: entityType || undefined });
  const [presign] = usePresignAttachmentMutation();
  const [confirm] = useConfirmAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();

  const attachments = (data as any)?.data || [];
  const { register, handleSubmit, reset, watch } = useForm();
  const file = watch('file')?.[0] as File | undefined;

  const onUpload = async (fd: any) => {
    setUploadError(null);
    if (!fd.file?.[0]) { setUploadError('Please select a file'); return; }
    if (!fd.entityType || !fd.entityId) { setUploadError('Entity Type and Entity ID are required'); return; }
    const f: File = fd.file[0];
    const payload = {
      originalName: f.name,
      mimeType: f.type || 'application/octet-stream',
      size: f.size,
      entityType: fd.entityType,
      entityId: fd.entityId.trim(),
    };
    try {
      const pres = await presign(payload).unwrap();
      await confirm({
        storageKey: pres.storageKey,
        originalName: f.name,
        mimeType: f.type || 'application/octet-stream',
        size: f.size,
        entityType: fd.entityType,
        entityId: fd.entityId.trim(),
      }).unwrap();
      reset(); setShowUpload(false); setUploadError(null);
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || 'Upload failed';
      const details = e?.data?.errors?.map((x: any) => `${x.field}: ${x.message}`).join(', ');
      const full = details ? `${msg} — ${details}` : msg;
      // Handle 401 session expired
      if (e?.status === 401 || msg.includes('Unauthorized') || msg.includes('access token')) {
        setUploadError('Session expired. Please log in again.');
      } else if (e?.status === 422) {
        setUploadError(full || 'Validation failed. Check Entity ID (must be valid ID) and file type (PDF, PNG, JPG, CSV, TXT).');
      } else {
        setUploadError(full);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Paperclip className="w-6 h-6" /> Attachments</h1>
          <p className="text-sm text-slate-500 mt-1">Files attached to leads, contacts, companies, deals — S3 presigned flow (10MB max)</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="h-10 px-5 rounded-xl bg-slate-900 text-white"><Upload className="w-4 h-4 mr-2" /> Upload File</Button>
      </div>

      <div className="flex gap-3">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm">
          <option value="">All entities</option>
          <option value="LEAD">Leads</option><option value="CONTACT">Contacts</option><option value="COMPANY">Companies</option><option value="DEAL">Deals</option><option value="TASK">Tasks</option>
        </select>
        {entityType && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEntityType('')}><Filter className="w-4 h-4 mr-1" /> Clear</Button>}
      </div>

      <Dialog open={showUpload} onOpenChange={(o) => { setShowUpload(o); if (!o) setUploadError(null); }}>
        <DialogContent onClose={() => { setShowUpload(false); setUploadError(null); }} className="max-w-[520px]">
          <DialogHeader><DialogTitle>Upload Attachment</DialogTitle><DialogDescription>Select a file and link it to an entity. Allowed: PDF, images, CSV — max 10MB.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit(onUpload)} className="space-y-4 p-6 pt-0">
            {uploadError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{uploadError}</div>}
            {listError && (listError as any)?.status === 401 && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-sm">Session expired — please <a href="/login" className="underline font-medium">log in again</a>.</div>}
            <div><Label>File *</Label><Input type="file" {...register('file', { required: true })} className="mt-1.5 h-11 bg-slate-50 rounded-xl" accept=".pdf,.png,.jpg,.jpeg,.csv,.txt" />{file && <p className="text-xs text-slate-500 mt-1">{file.name} • {(file.size / 1024).toFixed(1)} KB • {file.type || 'auto-detect'}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Entity Type *</Label><select {...register('entityType', { required: true })} className="mt-1.5 h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm"><option value="">Select</option><option value="LEAD">Lead</option><option value="CONTACT">Contact</option><option value="COMPANY">Company</option><option value="DEAL">Deal</option><option value="TASK">Task</option></select></div>
              <div><Label>Entity ID *</Label><Input {...register('entityId', { required: true })} placeholder="Paste entity ID" className="mt-1.5 h-11 bg-slate-50 rounded-xl" /></div>
            </div>
            <p className="text-xs text-slate-500">Hint: copy ID from Leads/Deals details page URL — e.g. <span className="mono bg-slate-100 px-1 rounded">cmu5rgneg...</span>. The ID must exist in your workspace.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setShowUpload(false); setUploadError(null); }}>Cancel</Button>
              <Button type="submit" className="rounded-xl bg-slate-900 text-white">Upload & Confirm</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)} className="max-w-[400px]">
          <DialogHeader><DialogTitle>Delete attachment?</DialogTitle><DialogDescription>This will remove the file record.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={async () => { if (deleteId) { await deleteAttachment(deleteId).unwrap(); setDeleteId(null); } }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}</div> : attachments.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center mx-auto mb-3"><HardDrive className="w-6 h-6 text-slate-400" /></div>
          <div className="font-semibold">No attachments yet</div><p className="text-sm text-slate-500 mt-1">Upload files linked to your CRM records.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((a: any) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow bg-white overflow-hidden">
              <div className="h-1 w-full bg-slate-900" />
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-sm">{a.originalName}</div>
                    <div className="text-xs text-slate-500">{a.mimeType} • {(a.size / 1024).toFixed(1)} KB</div>
                    <div className="text-xs text-slate-500 mt-1">{a.entityType} • <span className="mono bg-slate-100 px-1 rounded">{a.entityId.slice(0, 8)}…</span></div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs" onClick={() => { window.open(`/api/v1/attachments/${a.id}/download`, '_blank'); }}><Download className="w-3 h-3 mr-1" /> Download</Button>
                  <Button size="sm" variant="ghost" className="rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => setDeleteId(a.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
