import { Navigate } from 'react-router-dom';
import { getIdToken, isTokenExpired, isAdminToken } from '../store/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getIdToken();

  if (!token || isTokenExpired()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminToken(token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">접근 권한 없음</p>
          <p className="text-gray-500">어드민 계정으로 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
