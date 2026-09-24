import { useGetSalesReportQuery, useGetLeadsReportQuery, useGetActivitiesReportQuery } from '../../api/searchApi.ts';
import { BarChart3, Users, Activity, Download } from 'lucide-react';
import { Button } from '../../components/ui/button.tsx';

export const Reports = () => {
  const { data: sales } = useGetSalesReportQuery({});
  const { data: leads } = useGetLeadsReportQuery({});
  const { data: acts } = useGetActivitiesReportQuery({});
  const s: any = sales?.data || sales;
  const l: any = leads?.data || leads;
  const a: any = acts?.data || acts;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Reports</h1><p className="text-sm text-slate-500 mt-1">Sales by status/pipeline, leads by status/source, activities by type — CSV export.</p></div>
        <Button variant="outline" className="rounded-xl" onClick={() => window.open('/api/v1/reports/sales?format=csv', '_blank')}><Download className="w-4 h-4 mr-2" /> Sales CSV</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 font-medium text-sm"><BarChart3 className="w-4 h-4 text-emerald-600" /> Sales <span className="ml-auto text-xs bg-slate-100 border px-2 py-0.5 rounded-full">{s?.totalDeals ?? 0} deals</span></div>
          <div className="mt-3 space-y-1.5 text-sm">
            {s?.byStatus?.length ? s.byStatus.map((r: any) => <div key={r.status} className="flex justify-between p-2 rounded-xl bg-slate-50 border"><span>{r.status}</span><span className="font-medium">{r._count.id} • ${Number(r._sum.amount || 0).toLocaleString()}</span></div>) : <div className="text-xs text-muted-foreground">No deals</div>}
            <div className="pt-2 border-t font-semibold">Won revenue: ${Number(s?.revenueWon || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 font-medium text-sm"><Users className="w-4 h-4 text-blue-600" /> Leads <span className="ml-auto text-xs bg-slate-100 border px-2 py-0.5 rounded-full">{l?.totalLeads ?? 0}</span></div>
          <div className="mt-3 space-y-1.5 text-sm">
            {l?.byStatus?.length ? l.byStatus.map((r: any) => <div key={r.status} className="flex justify-between p-2 rounded-xl bg-slate-50 border"><span>{r.status}</span><span className="font-medium">{r._count.id}</span></div>) : <div className="text-xs text-muted-foreground">No leads</div>}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 font-medium text-sm"><Activity className="w-4 h-4 text-violet-600" /> Activities <span className="ml-auto text-xs bg-slate-100 border px-2 py-0.5 rounded-full">{a?.totalActivities ?? 0}</span></div>
          <div className="mt-3 space-y-1.5 text-sm">
            {a?.byType?.length ? a.byType.map((r: any) => <div key={r.type} className="flex justify-between p-2 rounded-xl bg-slate-50 border"><span>{r.type}</span><span className="font-medium">{r._count.id}</span></div>) : <div className="text-xs text-muted-foreground">No activities</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
