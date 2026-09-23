import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/input.tsx';
import { Users, Activity, TrendingUp, Zap, ArrowUpRight, DollarSign, Briefcase, Target, CheckCircle2 } from 'lucide-react';
import { useGetMyOrgQuery } from '../../api/rbacApi.ts';
import { useGetDashboardQuery } from '../../api/salesApi.ts';
import { Button } from '../../components/ui/button.tsx';

export const Dashboard = () => {
  const { data: myOrg } = useGetMyOrgQuery({});
  const { data: dash, isLoading, isFetching, isError, error } = useGetDashboardQuery();
  const d: any = (dash as any)?.data;
  const errStatus = (error as any)?.status;
  const isUnauthorized = errStatus === 401;

  const stats = d
    ? [
        { label: 'Total Leads', value: d.totals.totalLeads, icon: Users, gradient: 'from-blue-500 to-cyan-500', change: `${d.conversionRate}% conv.` },
        { label: 'Open Deals', value: d.totals.openDeals, icon: Briefcase, gradient: 'from-violet-500 to-fuchsia-500', change: `${d.totals.wonDeals} won` },
        { label: 'Revenue', value: `$${Number(d.revenue).toLocaleString()}`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500', change: `Pipeline $${Number(d.pipelineValue).toLocaleString()}` },
        { label: 'Win Rate', value: `${d.winRate}%`, icon: Target, gradient: 'from-amber-500 to-orange-500', change: `${d.totals.wonDeals}W / ${d.totals.lostDeals}L` },
      ]
    : [
        { label: 'Loading...', value: '—', icon: Activity, gradient: 'from-slate-400 to-slate-500', change: 'fetching' },
      ];

  if (isUnauthorized) {
    return (
      <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-xl">
        <p className="font-semibold text-amber-800">Session expired</p>
        <p className="text-sm text-amber-700 mt-1">Your login has expired. Please log in again to view the dashboard.</p>
        <Button className="mt-4 rounded-xl bg-slate-900 text-white" onClick={() => { localStorage.removeItem('crm_auth'); window.location.href = '/login'; }}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-slate-900 text-white font-medium"><Zap className="w-3 h-3" /> PHASE 5 • SALES • REDIS OK {isFetching && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />} {isError && !isUnauthorized && <span className="text-amber-300">• retrying</span>}</div>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome to <span className="font-semibold text-foreground">{(myOrg as any)?.data?.name || 'your workspace'}</span> — {d ? `Leads ${d.totals.totalLeads} • Deals ${d.totals.totalDeals} • Weighted $${Number(d.weightedPipeline).toLocaleString()}` : isError ? 'Unable to load dashboard' : 'Loading dashboard...'} {isLoading && '• fetching'}</p>
          {isError && !isUnauthorized && <p className="text-xs text-red-600 mt-1">Failed to load dashboard. Retrying via refresh token… If this persists, please log in again.</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>Refresh {isFetching ? '•' : ''}</Button>
          <Button className="rounded-xl bg-slate-900 hover:bg-slate-900/90">New deal <ArrowUpRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>

      {/* Stats — futuristic glow cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden border-0 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
            <div className={`h-1 w-full bg-gradient-to-r ${s.gradient}`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground font-semibold">{s.label}</p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">{s.value}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2 font-medium"><TrendingUp className="w-3 h-3" /> {s.change} this week</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-md`}><s.icon className="w-6 h-6" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><Activity className="w-4 h-4" /> {d ? 'Sales Pipeline' : 'Live Activity'}</CardTitle><span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border">{d ? `$${Number(d.pipelineValue).toLocaleString()} open` : 'Realtime'}</span></CardHeader>
          <CardContent className="space-y-3">
            {(d ? d.charts.dealPipeline : [
              { dot: 'bg-violet-500', title: 'Phase 5 Sales live', desc: 'Pipelines + Deals Kanban + Dashboard aggregates • 60s cache', time: 'now', glow: true },
              { dot: 'bg-emerald-500', title: 'Redis ok', desc: 'PostgreSQL + Redis ready • GET /health ok', time: '1m' },
            ]).map((a: any) => (
              a.stageName ? (
                <div key={a.stageId} className="flex gap-3 items-center p-4 rounded-2xl border bg-slate-50/50 hover:bg-white transition-colors">
                  <div className="w-2 h-2 rounded-full" style={{ background: a.color || '#64748b' }} />
                  <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{a.stageName} — {a.count} deals</div><div className="text-xs text-muted-foreground truncate">${Number(a.amount).toLocaleString()} • {a.probability}% • {a.color}</div></div>
                  <span className="text-xs font-medium">{a.count}</span>
                </div>
              ) : (
                <div key={a.title} className={`flex gap-3 items-center p-4 rounded-2xl border ${a.glow ? 'bg-gradient-to-br from-violet-50/50 to-white glow' : 'bg-slate-50/50 hover:bg-white'} transition-colors`}>
                  <div className={`w-2 h-2 rounded-full ${a.dot} ${a.glow ? 'animate-glow' : ''}`} />
                  <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{a.title}</div><div className="text-xs text-muted-foreground truncate">{a.desc}</div></div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                </div>
              )
            ))}
            {d && (
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-muted-foreground uppercase tracking-widest">Revenue (6m)</div><div className="font-mono text-sm mt-1">{d.charts.revenueOverTime.map((r:any)=>`${r.month}:${r.revenue}`).join(' • ')}</div></div>
                <div className="p-3 rounded-xl bg-slate-50 border"><div className="text-muted-foreground uppercase tracking-widest">Leads by Source</div><div className="font-medium mt-1">{d.charts.leadsBySource.map((s:any)=>`${s.source} ${s.count}`).join(', ')}</div></div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-slate-900 to-slate-700" />
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {d ? 'Recent Deals' : 'Quick Actions'}</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {d ? d.recent.deals.slice(0,3).map((deal:any)=>(
                <a key={deal.id} href={`/deals`} className="group flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 transition-colors"><span className="text-sm font-medium truncate">{deal.name}</span><span className="text-xs px-2 py-1 rounded-full bg-slate-100">{deal.status} • ${Number(deal.amount).toLocaleString()}</span></a>
              )) : (
                <>
                  <a href="/users" className="group flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 transition-colors"><span className="text-sm font-medium">Invite user</span><ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" /></a>
                  <a href="/roles" className="group flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50"><span className="text-sm font-medium">Create role</span><span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700">55 perms</span></a>
                  <a href="/teams" className="group flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50"><span className="text-sm font-medium">New team</span><ArrowUpRight className="w-4 h-4" /></a>
                </>
              )}
              {d && <a href="/deals" className="text-xs text-center text-muted-foreground hover:text-foreground">View Kanban →</a>}
            </CardContent>
          </Card>

          <Card className="gradient-primary text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <CardContent className="p-5 relative">
              <div className="text-xs font-semibold tracking-widest opacity-80">PHASE 5 LIVE</div>
              <div className="font-bold mt-1">Sales — Pipelines & Kanban</div>
              <p className="text-xs text-white/70 mt-1">Drag deals between stages → POST /move-stage validates stage∈pipeline.</p>
              <a href="/deals"><Button size="sm" className="mt-3 bg-white text-slate-900 hover:bg-white/90 w-full">Open Kanban →</Button></a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
