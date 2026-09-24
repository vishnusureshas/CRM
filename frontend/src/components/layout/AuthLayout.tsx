import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Zap, Users, TrendingUp, Layers, ArrowUpRight, Check, BarChart3, Workflow, Lock } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Left — Futuristic light showcase */}
      <div className="hidden lg:flex lg:w-[56%] relative overflow-hidden bg-gradient-to-br from-white via-[#f8fafc] to-[#eef2ff] flex-col border-r border-slate-200/60">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-[0.035]" />
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full blur-[100px] opacity-[0.12]" style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] -left-32 w-[600px] h-[600px] rounded-full blur-[110px] opacity-[0.10]" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.07]" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-10">
          {/* Top nav — light */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm shadow-primary/20"><ShieldCheck className="w-5 h-5 text-white" /></div>
            <div className="leading-none"><div className="font-semibold tracking-tight text-slate-900">PulseCRM</div><div className="text-[10px] tracking-[0.16em] text-slate-400 uppercase">Enterprise OS — 2026</div></div>
            <span className="ml-3 hidden xl:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All systems operational</span>
          </Link>

          {/* Hero + futuristic light mock */}
          <div className="flex-1 flex flex-col justify-center py-8 gap-8 max-w-[560px] mx-auto w-full">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs text-slate-700"><span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center -ml-1"><Sparkles className="w-3.5 h-3.5 text-white" /></span> New — Futuristic CRM OS <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold ml-1">2026</span></div>
              <h1 className="text-[32px] xl:text-[38px] font-bold leading-[0.92] tracking-tight text-slate-900">
                Your pipeline,
                <span className="block text-gradient">reimagined.</span>
              </h1>
              <p className="text-slate-500 leading-relaxed text-[14px] max-w-[44ch]">
                Light, fast, and human. Track leads, close deals, and empower teams — with org-isolated data, RBAC, and a design your team will love.
              </p>
            </div>

            {/* Light glass dashboard preview — futuristic */}
            <div className="rounded-[24px] bg-white/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.06)] border border-white/80 overflow-hidden animate-float">
              <div className="h-10 flex items-center gap-1.5 px-4 border-b border-slate-100 bg-white/60">
                <span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-500 mono flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> pulse-crm • dashboard</span>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3 bg-gradient-to-b from-white to-slate-50/50">
                  {[
                  { k: 'Revenue', v: '$2.4m', sub: '+12.4%', Icon: TrendingUp, c: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { k: 'Deals', v: '342', sub: '64 won', Icon: BarChart3, c: 'text-blue-600', bg: 'bg-blue-50' },
                  { k: 'Pipeline', v: '94%', sub: 'Coverage', Icon: Workflow, c: 'text-violet-600', bg: 'bg-violet-50' },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl border border-slate-200/60 bg-white p-3.5 shadow-sm">
                    <div className="flex items-center justify-between"><span className="text-[11px] tracking-widest uppercase text-slate-400 font-medium">{s.k}</span><span className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}><s.Icon className={`w-3.5 h-3.5 ${s.c}`} /></span></div>
                    <div className="font-bold text-slate-900 mt-2 text-[18px]">{s.v}</div>
                    <div className={`text-xs font-medium ${s.c}`}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 bg-white">
                <div className="rounded-2xl border border-slate-200/70 divide-y divide-slate-100 overflow-hidden">
                  {[
                    { n: 'Acme Inc', e: 'acme@crm.local', s: 'Qualified', col: 'bg-blue-500' },
                    { n: 'Hertex Ltd', e: 'hertex@crm.local', s: 'Proposal', col: 'bg-violet-500' },
                    { n: 'Nimbus Co', e: 'nimbus@crm.local', s: 'New', col: 'bg-cyan-500' },
                  ].map((r) => (
                    <div key={r.n} className="flex items-center gap-3 p-3.5 hover:bg-slate-50/70 transition-colors">
                      <div className={`w-9 h-9 rounded-xl ${r.col} text-white flex items-center justify-center text-xs font-semibold shadow-sm`}>{r.n[0]}</div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-900 truncate">{r.n}</div><div className="text-xs text-slate-500 truncate">{r.e}</div></div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-sm font-medium">{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap, label: 'Latency', value: '42ms' },
                { icon: Users, label: 'Uptime', value: '99.9%' },
                { icon: Workflow, label: 'Automated', value: '100%' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200/60 shadow-sm text-xs">
                  <span className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center"><f.icon className="w-3.5 h-3.5 text-slate-600" /></span>
                  <div className="leading-none"><div className="text-slate-500">{f.label}</div><div className="font-semibold text-slate-900 mt-0.5">{f.value}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-xs border-t border-slate-200/60 pt-4">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> SOC 2 • GDPR • RBAC</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> ESM • PostgreSQL • Redis</span>
          </div>
        </div>
      </div>

      {/* Right — Form — always light */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 relative bg-white">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="absolute inset-0 grid-pattern opacity-[0.025]" />
        <div className="relative w-full max-w-[400px] animate-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white shadow-sm"><ShieldCheck className="w-5 h-5" /></div>
            <div><div className="font-bold leading-none text-slate-900">PulseCRM</div><div className="text-[11px] tracking-widest text-slate-500 uppercase">Enterprise OS</div></div>
          </div>

          <div className="absolute -inset-4 rounded-[28px] blur-2xl opacity-[0.06] -z-10" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} />
          <Outlet />

          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> 256-bit</span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> RBAC</span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Isolated</span>
          </div>
          <p className="text-center text-[11px] text-slate-500 mt-3">By continuing you agree to Terms & Privacy. <Link to="/login" className="underline decoration-slate-300 underline-offset-4 hover:text-slate-700">Learn more <ArrowUpRight className="w-3 h-3 inline" /></Link></p>
        </div>
      </div>
    </div>
  );
};
