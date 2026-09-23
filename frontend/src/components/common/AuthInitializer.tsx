import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store.ts';
import { setCredentials } from '../../features/auth/authSlice.ts';

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const [bootstrapping, setBootstrapping] = useState(() => !token);

  useEffect(() => {
    if (token) {
      setBootstrapping(false);
      return;
    }
    let cancelled = false;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    // Silent refresh via httpOnly cookie - restores session after hard refresh
    fetch(`${apiUrl}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('no session');
        const json = await res.json();
        const data = json?.data;
        if (data?.accessToken && !cancelled) {
          dispatch(setCredentials({ accessToken: data.accessToken, user: data.user, organization: data.organization }));
        }
      })
      .catch(() => {
        // no valid session - stay unauthenticated, ProtectedRoute will redirect
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => { cancelled = true; };
  }, [token, dispatch]);

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfd]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Restoring session…</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
