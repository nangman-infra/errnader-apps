import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasStoredAuthSession } from '../api/tokenStorage';

export function ProtectedRoute() {
  const location = useLocation();

  if (!hasStoredAuthSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
