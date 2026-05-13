import { isAxiosError } from 'axios';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMyProfile } from '../api/profile';
import { StateBlock } from './StateBlock';
import { isProfileComplete } from '../utils/profile';

export function RequireCompleteProfile() {
  const location = useLocation();
  const { data: profile, isLoading, isError, error } = useMyProfile();

  if (isLoading) {
    return <StateBlock title="프로필을 확인하는 중입니다" />;
  }

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <Navigate to="/profile/setup" replace state={{ from: location.pathname }} />;
    }
    if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <StateBlock title="프로필을 불러오는 중 문제가 발생했습니다" />;
  }

  if (!isProfileComplete(profile)) {
    return <Navigate to="/profile/setup" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
