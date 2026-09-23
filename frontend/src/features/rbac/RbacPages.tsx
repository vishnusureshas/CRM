import { useGetRolesQuery, useCreateRoleMutation, useGetPermissionsQuery, useGetUsersQuery, useGetTeamsQuery, useCreateTeamMutation } from '../../api/rbacApi.ts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input, Label } from '../../components/ui/input.tsx';
import { Shield, UsersRound } from 'lucide-react';
import { useState } from 'react';

export const RolesPage = () => {
  const { data: roles } = useGetRolesQuery({});
  const { data: perms } = useGetPermissionsQuery({});
  const [createRole, { isLoading }] = useCreateRoleMutation();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (slug: string) => setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  const handleCreate = async () => {
    if (!name) return;
    await createRole({ name, permissionSlugs: selected }).unwrap();
    setName(''); setSelected([]);
  };
  const permList = (perms as any)?.data || [];
  const grouped: Record<string, any[]> = {};
  permList.forEach((p: any) => { (grouped[p.resource] ||= []).push(p); });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Roles & Permissions</h1><p className="text-muted-foreground">Org-scoped roles • 55 permissions • system roles protected</p></div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" />All Roles</CardTitle></CardHeader><CardContent className="space-y-2">{(roles as any)?.data?.map((r: any) => (<div key={r.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50"><div><div className="font-medium text-sm">{r.name}</div><div className="text-xs text-muted-foreground">{r.slug} • {r.permissions?.length || 0} perms</div></div><span className={`text-xs px-2 py-1 rounded-full ${r.organizationId ? 'bg-blue-50 text-blue-700' : 'bg-slate-100'}`}>{r.organizationId ? 'Custom' : 'System'}</span></div>))}</CardContent></Card>
        <Card><CardHeader><CardTitle>Create Role</CardTitle></CardHeader><CardContent className="space-y-3"><div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Lead" /></div><div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">{Object.entries(grouped).map(([res, list]) => (<div key={res}><div className="text-xs font-semibold text-muted-foreground uppercase mt-2">{res}</div>{list.map((p: any) => (<label key={p.slug} className="flex items-center gap-2 text-sm py-1"><input type="checkbox" checked={selected.includes(p.slug)} onChange={() => toggle(p.slug)} className="rounded" />{p.slug}</label>))}</div>))}</div><Button onClick={handleCreate} disabled={isLoading || !name} className="w-full">Create role</Button></CardContent></Card>
      </div>
    </div>
  );
};

export const UsersPage = () => {
  const { data } = useGetUsersQuery({ page: 1, limit: 20 });
  const list = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Users</h1><p className="text-muted-foreground">Org-isolated • {pagination?.total ?? 0} total</p></div><Button>Invite User</Button></div>
      <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr><th className="text-left p-3 font-medium">Name</th><th className="text-left p-3 font-medium">Email</th><th className="text-left p-3 font-medium">Role</th><th className="text-left p-3 font-medium">Status</th></tr></thead><tbody>{list.map((u: any) => (<tr key={u.id} className="border-b hover:bg-slate-50"><td className="p-3 font-medium">{u.firstName} {u.lastName}</td><td className="p-3 text-muted-foreground">{u.email}</td><td className="p-3"><span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">{u.memberships?.[0]?.role?.name || '—'}</span></td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50'}`}>{u.status}</span></td></tr>))}</tbody></table></CardContent></Card>
    </div>
  );
};

export const TeamsPage = () => {
  const { data } = useGetTeamsQuery({});
  const [createTeam] = useCreateTeamMutation();
  const [name, setName] = useState('');
  const list = (data as any)?.data || [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Teams</h1><p className="text-muted-foreground">{list.length} teams</p></div><div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alpha Team" className="w-48" /><Button onClick={async () => { if (!name) return; await createTeam({ name }).unwrap(); setName(''); }}>Create</Button></div></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{list.map((t: any) => (<Card key={t.id}><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="w-4 h-4" />{t.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{t.members?.length || 0} members • {t._count?.leads ?? 0} leads</p><div className="flex -space-x-2 mt-3">{t.members?.slice(0, 4).map((m: any) => (<div key={m.userId} className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs border-2 border-white">{m.user.firstName?.[0]}</div>))}</div></CardContent></Card>))}{list.length === 0 && <Card className="p-8 text-center text-muted-foreground">No teams yet — create your first team.</Card>}</div>
    </div>
  );
};

export const OrganizationsPage = () => {
  return <div className="text-muted-foreground">Organizations admin page — Phase 3: use GET /organizations (admin only).</div>;
};
