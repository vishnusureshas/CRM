import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Building2, UsersRound, LogOut, Search, Bell, Menu, ShieldCheck, Command, Settings, Kanban, Layers, TrendingUp, Paperclip, Mail, BellRing, Crown, ScrollText } from 'lucide-react';
import { useGetNotificationsQuery } from '../../api/filesApi.ts';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice.ts';
import { Button } from '../ui/button.tsx';
import { useState } from 'react';
import { useLogoutMutation } from '../../api/authApi.ts';
import { logout } from '../../features/auth/authSlice.ts';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, desc: 'Dashboard • metrics' },
  { to: '/leads', label: 'Leads', icon: Users, desc: 'Kanban • drag' },
  { to: '/contacts', label: 'Contacts', icon: Users, desc: 'People' },
  { to: '/companies', label: 'Companies', icon: Building2, desc: 'Accounts' },
  { to: '/deals', label: 'Deals', icon: Kanban, desc: 'Kanban • drag' },
  { to: '/pipelines', label: 'Pipelines', icon: Layers, desc: 'Stages • reorder' },
  { to: '/tasks', label: 'Tasks', icon: Shield, desc: 'Follow-ups' },
  { to: '/attachments', label: 'Files', icon: Paperclip, desc: 'S3 • presign' },
  { to: '/communications', label: 'Emails', icon: Mail, desc: 'Email log' },
  { to: '/notifications', label: 'Alerts', icon: BellRing, desc: 'In-app' },
  { to: '/users', label: 'Users', icon: UsersRound, desc: 'Members' },
  { to: '/roles', label: 'Roles', icon: Shield, desc: 'Permissions' },
  { to: '/teams', label: 'Teams', icon: UsersRound, desc: 'Teams' },
  { to: '/organizations', label: 'Organizations', icon: Building2, desc: 'Workspaces' },
  { to: '/admin', label: 'Admin', icon: Crown, desc: 'Overview' },
  { to: '/admin/users', label: 'Admin Users', icon: Users, desc: 'Suspend' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, desc: 'Timeline' },
];

export const DashboardLayout = () => {
  const user = useSelector(selectCurrentUser) as any;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutApi] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loc = useLocation();
  const { data: notifData } = useGetNotificationsQuery({ isRead: 'false' });
  const unread = (notifData as any)?.unreadCount ?? 0;

  const handleLogout = async () => { try { await logoutApi({}).unwrap(); } catch {} dispatch(logout()); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex">
      {/* Sidebar — premium, structured, narrow */}
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 z-30 w-[260px] h-screen bg-white border-r flex flex-col transition-transform duration-200 shrink-0`}>
        {/* Brand — tight, premium */}
        <div className="h-[56px] flex items-center gap-3 px-4 border-b shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white"><ShieldCheck className="w-4 h-4" /></div>
          <div className="leading-none">
            <div className="font-semibold text-[14px] tracking-tight">PulseCRM</div>
            <div className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Enterprise OS</div>
          </div>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>

        {/* Command — subtle */}
        <div className="p-3">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border text-sm text-muted-foreground hover:bg-white hover:border-slate-200 transition-colors">
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left text-[13px]">Search…</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] border bg-white px-1.5 py-0.5 rounded-md mono">⌘K</span>
          </button>
        </div>

        {/* Nav — structured groups */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <div>
            <div className="px-2 mb-2 text-[11px] font-semibold tracking-widest text-muted-foreground/70 uppercase">General</div>
            <div className="space-y-0.5">
              {nav.map((n) => {
                const active = loc.pathname === n.to;
                return (
                  <NavLink key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <n.icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium leading-none">{n.label}</div>
                      <div className={`text-[11px] leading-none mt-0.5 ${active ? 'text-white/60' : 'text-muted-foreground'}`}>{n.desc}</div>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white p-4 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest opacity-80"><TrendingUp className="w-3 h-3" /> PHASE 7 LIVE</div>
              <div className="font-semibold text-sm mt-2">Admin — integrated</div>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">Dashboard, users, orgs, audit logs • light CRM</p>
              <Button size="sm" className="mt-3 w-full bg-white text-slate-900 hover:bg-white/90 rounded-lg h-8 text-xs" onClick={() => navigate('/admin')}>Open Admin →</Button>
            </div>
          </div>
        </nav>

        {/* User — compact, premium */}
        <div className="p-3 border-t bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">{user?.firstName?.[0] || 'U'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate leading-none">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email?.split('@')[0]}</div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="flex gap-1.5 mt-3">
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs rounded-lg"><Settings className="w-3 h-3 mr-1" />Settings</Button>
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs rounded-lg" onClick={handleLogout}><LogOut className="w-3 h-3 mr-1" />Out</Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[56px] bg-white/80 backdrop-blur-xl border-b flex items-center gap-3 px-4 sticky top-0 z-20">
          <Button variant="ghost" size="icon" className="lg:hidden -ml-1" onClick={() => setMobileOpen(!mobileOpen)}><Menu className="w-5 h-5" /></Button>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-slate-900 text-white font-medium mono text-[11px]">Phase 7 • Admin</span>
            <span className="hidden lg:inline text-muted-foreground">Postgres • Redis ok • Admin • Files • Email</span>
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-3 py-1.5 bg-slate-50">
            <Command className="w-3.5 h-3.5" /> Press <span className="mono border bg-white px-1 rounded">⌘K</span>
          </div>
          <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => navigate('/notifications')}><Bell className="w-4 h-4" />{unread > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>}</Button>
          <div className="w-px h-5 bg-border hidden sm:block" />
          <span className="hidden sm:block text-xs text-muted-foreground mono">v7.0</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-7">
          <div className="max-w-[1280px] mx-auto"><Outlet /></div>
        </main>
      </div>
      {mobileOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm lg:hidden z-20" onClick={() => setMobileOpen(false)} />}
    </div>
  );
};
