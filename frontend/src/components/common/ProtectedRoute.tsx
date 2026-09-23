import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../features/auth/authSlice.ts';

/**
 * ProtectedRoute now relies on AuthInitializer (main.tsx) to have attempted
 * silent refresh via httpOnly cookie before we decide to redirect.
 * We also guard against the transient null state while AuthInitializer is
 * bootstrapping by NOT redirecting instantly if a refresh is in-flight -
 * the parent AuthInitializer already shows a loader.
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useSelector(selectIsAuthenticated);
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const PublicOnly = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useSelector(selectIsAuthenticated);
  if (isAuth) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
