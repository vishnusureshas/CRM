import { useRole, hasPerm } from '../../hooks/useRole.ts';

export const RequireRole = ({ roles, children }: { roles: string[]; children: React.ReactNode }) => {
  const role = useRole();
  if (!roles.includes(role)) {
    return (
      <div className="p-8 text-center rounded-2xl border bg-white max-w-xl mx-auto mt-8">
        <h2 className="font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Requires role: <code className="mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{roles.join(' or ')}</code> — your role is{' '}
          <code className="mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{role}</code>.
        </p>
        <p className="text-xs text-muted-foreground mt-2">Backend enforces <code className="mono bg-slate-100 px-1 py-0.5 rounded">authorize('admin:read')</code>.</p>
      </div>
    );
  }
  return <>{children}</>;
};

export const Can = ({ perm, children, fallback = null }: { perm: string; children: React.ReactNode; fallback?: React.ReactNode }) => {
  const role = useRole();
  return hasPerm(role, perm) ? <>{children}</> : <>{fallback}</>;
};
