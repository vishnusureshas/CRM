import { useGetAuditLogsQuery } from '../../api/adminApi.ts';
import { Clock, FileText } from 'lucide-react';

export const AuditLogs = () => {
  const { data, isLoading, error } = useGetAuditLogsQuery({ page: 1, limit: 20 });
  const logs: any[] = (data as any)?.data || [];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading audit logs…</div>;

  if (error && (error as any)?.status === 404) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <FileText className="w-8 h-8 mx-auto text-slate-300" />
        <h3 className="font-medium mt-3">Audit logs pending backend</h3>
        <p className="text-sm text-muted-foreground mt-1">Backend <code className="mono bg-slate-100 px-1 py-0.5 rounded text-xs">GET /admin/audit-logs</code> not yet implemented. Logs are already written via <code className="mono bg-slate-100 px-1 py-0.5 rounded text-xs">prisma.auditLog.create</code> on every mutation. Frontend will poll here when available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>
        <div><h2 className="text-lg font-semibold">Audit Logs</h2><p className="text-xs text-muted-foreground">Append-only • CREATE/UPDATE/DELETE • from <code className="mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">/admin/audit-logs</code></p></div>
      </div>

      <div className="rounded-2xl border bg-white divide-y">
        {logs.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No audit logs yet. Create a Lead/Company to generate one.</div>}
        {logs.map((l: any) => (
          <div key={l.id} className="p-3.5 flex items-center gap-3 text-sm">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${l.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : l.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{l.action}</span>
            <span className="font-medium">{l.resource}</span>
            <span className="text-muted-foreground truncate">{l.resourceId?.slice(0, 8)}</span>
            <span className="ml-auto text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
