import { useGetUsersQuery } from '../../api/rbacApi.ts';
import { useUpdateAdminUserStatusMutation } from '../../api/adminApi.ts';
import { Button } from '../../components/ui/button.tsx';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';

export const UserMgmt = () => {
  const { data, isLoading } = useGetUsersQuery({});
  const [updateStatus, { isLoading: saving }] = useUpdateAdminUserStatusMutation();
  const users: any[] = (data as any)?.data || (data as any)?.users || [];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading users…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="w-4 h-4 text-blue-600" /></div>
        <div><h2 className="text-lg font-semibold">Users</h2><p className="text-xs text-muted-foreground">Org members • suspend/activate via <code className="mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">PATCH /admin/users/:id/status</code> (falls back to local)</p></div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b text-xs tracking-widest uppercase text-slate-500">
              <tr><th className="px-4 py-2.5 text-left font-medium">User</th><th className="px-4 py-2.5 text-left font-medium">Role</th><th className="px-4 py-2.5 text-left font-medium">Status</th><th className="px-4 py-2.5 text-right font-medium">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No users in this org. Invite via <span className="font-medium text-foreground">Users → Create</span>.</td></tr>}
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3"><div className="font-medium flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-slate-400" />{u.firstName} {u.lastName}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-white border">{u.role?.slug || u.roleId || '—'}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full border font-medium ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{u.status}</span></td>
                  <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={saving} onClick={() => updateStatus({ id: u.id, status: 'ACTIVE' }).unwrap().catch(() => alert('Backend PATCH /admin/users/:id/status not yet implemented — seed/fallback only'))}><UserCheck className="w-3 h-3 mr-1" /> Activate</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={saving} onClick={() => updateStatus({ id: u.id, status: 'SUSPENDED' }).unwrap().catch(() => alert('Backend PATCH /admin/users/:id/status not yet implemented'))}><UserX className="w-3 h-3 mr-1" /> Suspend</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
