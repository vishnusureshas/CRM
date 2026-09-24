import { useGetOrganizationsQuery } from '../../api/rbacApi.ts';
import { useSuspendOrgMutation } from '../../api/adminApi.ts';
import { Button } from '../../components/ui/button.tsx';
import { Building2, Pause, Play } from 'lucide-react';

export const OrgMgmt = () => {
  const { data, isLoading } = useGetOrganizationsQuery({});
  const [suspend, { isLoading: saving }] = useSuspendOrgMutation();
  const orgs: any[] = (data as any)?.data || (data as any)?.organizations || (Array.isArray(data) ? data : data ? [data] : []);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading organizations…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center"><Building2 className="w-4 h-4 text-violet-600" /></div>
        <div><h2 className="text-lg font-semibold">Organizations</h2><p className="text-xs text-muted-foreground">Super-admin: suspend/activate • <code className="mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">PATCH /admin/organizations/:id/status</code></p></div>
      </div>

      <div className="grid gap-3">
        {orgs.length === 0 && <div className="rounded-2xl border bg-white p-8 text-center text-muted-foreground">No organizations found. Create via <span className="font-medium text-foreground">Register → new workspace</span>.</div>}
        {orgs.map((o: any) => (
          <div key={o.id || o.slug} className="rounded-2xl border bg-white p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-semibold">{(o.name || o.slug || '?')[0]}</div>
            <div className="flex-1 min-w-0"><div className="font-medium truncate">{o.name || o.slug}</div><div className="text-xs text-muted-foreground truncate">{o.slug} • {o.status || 'ACTIVE'}</div></div>
            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${o.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{o.status || 'ACTIVE'}</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={saving} onClick={() => suspend({ id: o.id, status: 'ACTIVE' }).unwrap().catch(() => alert('PATCH /admin/organizations/:id/status not yet implemented'))}><Play className="w-3 h-3 mr-1" /> Activate</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={saving} onClick={() => suspend({ id: o.id, status: 'SUSPENDED' }).unwrap().catch(() => alert('PATCH /admin/organizations/:id/status not yet implemented'))}><Pause className="w-3 h-3 mr-1" /> Suspend</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
