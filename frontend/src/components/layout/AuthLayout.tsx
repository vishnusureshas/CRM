import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Zap, Users, TrendingUp, Layers, ArrowUpRight, Check } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-[#fcfcfd]">
      {/* Left — Premium product preview */}
      <div className="hidden lg:flex lg:w-[56%] relative overflow-hidden bg-slate-950 flex-col">
        <div className="absolute inset-0 gradient-mesh-dark" />
        <div className="absolute inset-0 grid-pattern-dark" />
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full blur-[130px] opacity-20" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="absolute top-[45%] -left-24 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col h-full p-8 xl:p-10">
          {/* Top nav */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><ShieldCheck className="w-5 h-5 text-slate-900" /></div>
            <div className="leading-none"><div className="font-semibold text-white tracking-tight">PulseCRM</div><div className="text-[10px] tracking-[0.16em] text-white/40 uppercase">Enterprise OS — 2026</div></div>
            <span className="ml-3 hidden xl:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/70"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All systems operational</span>
          </Link>

          {/* Hero + mock */}
          <div className="flex-1 flex flex-col justify-center py-8 gap-8 max-w-[560px] mx-auto w-full">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80"><Sparkles className="w-3 h-3" /> New — Phase 3 RBAC live</div>
              <h1 className="text-[32px] xl:text-[36px] font-bold leading-[0.95] tracking-tight text-white">
                The CRM that
                <span className="block font-light text-white/60">scales with you.</span>
              </h1>
              <p className="text-white/55 leading-relaxed text-[14px] max-w-[44ch]">
                Structured pipeline, permission-aware, org-isolated. Built on PostgreSQL, ESM, and thoughtful design — not just CRUD.
              </p>
            </div>

            {/* Mock dashboard preview — premium */}
            <div className="rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden animate-float">
              <div className="h-9 flex items-center gap-1.5 px-4 border-b bg-slate-50">
                <span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-amber-400" /><span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-muted-foreground mono">pulse-crm • dashboard</span>
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-white">LIVE</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3 bg-white">
                {[
                  { k: 'Users', v: '1,248', sub: '+12%', c: 'text-blue-600' },
                  { k: 'Deals', v: '342', sub: '$2.4m', c: 'text-violet-600' },
                  { k: 'Teams', v: '24', sub: 'Active', c: 'text-emerald-600' },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border bg-slate-50 p-3">
                    <div className="text-[11px] tracking-widest uppercase text-muted-foreground font-medium">{s.k}</div>
                    <div className="font-bold mt-1">{s.v}</div>
                    <div className={`text-xs ${s.c}`}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 bg-white">
                <div className="rounded-xl border divide-y">
                  {[
                    { n: 'Acme Inc', e: 'acme@crm.local', s: 'Qualified' },
                    { n: 'Hertex Ltd', e: 'hertex@crm.local', s: 'Proposal' },
                  ].map((r) => (
                    <div key={r.n} className="flex items-center gap-3 p-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium">{r.n[0]}</div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.n}</div><div className="text-xs text-muted-foreground truncate">{r.e}</div></div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border">{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { icon: Zap, label: 'API latency', value: '42ms p95' },
                { icon: Users, label: 'Uptime', value: '99.9%' },
                { icon: TrendingUp, label: 'NPS', value: '74' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-white/60"><f.icon className="w-3.5 h-3.5" /><span>{f.label}</span><span className="ml-auto text-white font-medium">{f.value}</span></div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-white/25 text-xs border-t border-white/5 pt-4">
            <span>© 2026 PulseCRM • SOC 2 • GDPR • httpOnly • RBAC</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> ESM • PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 relative bg-white">
        <div className="absolute inset-0 grid-pattern opacity-[0.015]" />
        <div className="relative w-full max-w-[400px] animate-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div>
            <div><div className="font-bold leading-none">PulseCRM</div><div className="text-[11px] tracking-widest text-muted-foreground uppercase">Enterprise OS</div></div>
          </div>

          {/* Subtle glow behind card */}
          <div className="absolute -inset-4 rounded-[28px] blur-2xl opacity-[0.06] -z-10" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} />
          <Outlet />

          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> 256-bit</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> RBAC</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Isolated</span>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3">By continuing you agree to Terms & Privacy. <Link to="/login" className="underline">Learn more <ArrowUpRight className="w-3 h-3 inline" /></Link></p>
        </div>
      </div>
    </div>
  );
};
