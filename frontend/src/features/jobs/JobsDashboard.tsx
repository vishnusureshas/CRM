import { useGetDashboardQuery } from '../../api/salesApi.ts';
import { useEffect, useState } from 'react';
import { Cpu, Clock, Database, Layers, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';

export const JobsDashboard = () => {
  const { data, isFetching, refetch } = useGetDashboardQuery({} as any);
  const [health, setHealth] = useState<any>(null);
  const [lastFetch, setLastFetch] = useState<string>('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:5000'}/health`.replace('/api/v1','/health') || '/health')
      .then((r) => r.json()).then(setHealth).catch(() => setHealth({ status: 'unknown' }));
    // also try backend health directly
    fetch('https://crm-backend-4c4g.onrender.com/health').then((r)=>r.json()).then(setHealth).catch(()=>{});
  }, [isFetching]);

  useEffect(() => { if (data) setLastFetch(new Date().toLocaleTimeString()); }, [data]);

  const d: any = (data as any)?.data;

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> Jobs & Cache</h1>
          <p className="text-sm text-slate-500 mt-1">BullMQ queues • Redis cache • 60s dashboard cache • health</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => refetch()}><RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} /> Refresh</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4 text-emerald-600" /> Redis</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm"><span className={`w-2 h-2 rounded-full ${health?.redis === 'ok' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} /> {health?.redis || 'checking…'} <span className="ml-auto text-xs text-muted-foreground">{health?.status || ''}</span></div>
            <div className="text-xs text-muted-foreground mt-2">Upstash <code className="mono bg-slate-100 px-1 py-0.5 rounded">rediss://</code> • <code className="mono">crm-network</code></div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Dashboard Cache</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 60s TTL <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border">HIT</span></div>
            <div className="text-xs text-muted-foreground mt-2">Last fetch: {lastFetch || '—'} {isFetching && '• fetching…'}</div>
            <div className="text-xs text-muted-foreground">Key: <code className="mono bg-slate-100 px-1 py-0.5 rounded">dashboard:{'{orgId}'}</code></div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-violet-600" /> Queues</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 border"><span>send-email</span><span className="font-medium">0 pending</span></div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 border"><span>notifications</span><span className="font-medium">0 pending</span></div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 border"><span>reports:csv</span><span className="font-medium">0 pending</span></div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> BullMQ workers TODO — `src/jobs` planned</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border">
        <CardHeader><CardTitle className="text-base">Pipeline Cache</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between p-3 rounded-xl bg-slate-50 border"><span>pipelines:{'{orgId}'}</span><span className="text-xs px-2 py-1 rounded-full bg-white border">invalidated on create/update</span></div>
          <div className="flex justify-between p-3 rounded-xl bg-slate-50 border"><span>perms:{'{userId}:{orgId}'}</span><span className="text-xs px-2 py-1 rounded-full bg-white border">TTL 5m • SCAN clear on boot</span></div>
          {d && <div className="text-xs text-muted-foreground">Dashboard totals: Leads {d.totals.totalLeads} • Deals {d.totals.totalDeals} • from cache {lastFetch}</div>}
        </CardContent>
      </Card>
    </div>
  );
};
