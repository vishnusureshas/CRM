import { useGetAdminDashboardQuery } from '../../api/adminApi.ts';
import { useGetDashboardQuery } from '../../api/salesApi.ts';
import { ShieldCheck, Building2, Users, Layers, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: adminData, isLoading, error } = useGetAdminDashboardQuery(undefined as any);
  const { data: dashData } = useGetDashboardQuery({} as any);

  // Fallback to regular dashboard if /admin/dashboard not yet implemented (404)
  const stats = (adminData as any)?.data || (adminData as any) || null;
  const fallback = (dashData as any)?.data || (dashData as any);
  const isAdminReady = !!stats && !error;

  const cards = isAdminReady
    ? [
        { label: 'Organizations', value: stats.organizations ?? 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Users', value: stats.users ?? 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Deals', value: stats.deals ?? 0, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Revenue', value: `$${(stats.revenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
      ]
    : [
        { label: 'Total Leads', value: fallback?.totals?.totalLeads ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Companies', value: fallback?.totals?.totalCompanies ?? 0, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Open Deals', value: fallback?.totals?.openDeals ?? 0, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Revenue', value: `$${(fallback?.revenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
      ];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading admin dashboard…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Org-isolated aggregates • RBAC: admin:read • {isAdminReady ? 'from /admin/dashboard' : 'fallback from /dashboard (admin API pending)'}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${isAdminReady ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {isAdminReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {isAdminReady ? 'Live' : 'Fallback'}
        </span>
      </div>

      {!isAdminReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Backend <code className="mono bg-white px-1.5 py-0.5 rounded border">GET /admin/dashboard</code> not yet implemented — showing <code className="mono bg-white px-1 py-0.5 rounded border">GET /dashboard</code> aggregates. Implement <code className="mono">src/modules/admin</code> per BACKEND.md §23.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-medium tracking-widest uppercase text-slate-400">{c.label}</span><span className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}><c.icon className={`w-4 h-4 ${c.color}`} /></span></div>
            <div className="text-[22px] font-bold tracking-tight mt-2">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h3 className="font-medium">System status</h3>
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-slate-50 border">PostgreSQL <span className="float-right text-emerald-600 font-medium">ok</span></div>
          <div className="p-3 rounded-xl bg-slate-50 border">Redis <span className="float-right text-emerald-600 font-medium">ok</span></div>
          <div className="p-3 rounded-xl bg-slate-50 border">BullMQ <span className="float-right text-amber-600 font-medium">planned</span></div>
          <div className="p-3 rounded-xl bg-slate-50 border">S3 <span className="float-right text-slate-500">optional</span></div>
        </div>
      </div>
    </div>
  );
};
