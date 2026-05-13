import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireCompleteProfile } from './components/RequireCompleteProfile';
import { ChatPage } from './pages/ChatPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { ErrandBoardPage } from './pages/ErrandBoardPage';
import { ErrandDetailPage } from './pages/ErrandDetailPage';
import { ErrandNewPage } from './pages/ErrandNewPage';
import { ErranderListPage } from './pages/ErranderListPage';
import { HomePage } from './pages/HomePage';
import { InquiryCreatePage } from './pages/InquiryCreatePage';
import { InquiryListPage } from './pages/InquiryListPage';
import { LoginPage } from './pages/LoginPage';
import { MyErrandsPage } from './pages/MyErrandsPage';
import { MyPage } from './pages/MyPage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { ReviewCreatePage } from './pages/ReviewCreatePage';
import { VerifyLoginPage } from './pages/VerifyLoginPage';

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="login/verify" element={<VerifyLoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="profile/setup" element={<ProfileSetupPage />} />
        <Route element={<RequireCompleteProfile />}>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="erranders" element={<ErranderListPage />} />
            <Route path="errands" element={<ErrandBoardPage />} />
            <Route path="errands/new" element={<ErrandNewPage />} />
            <Route path="errands/:id" element={<ErrandDetailPage />} />
            <Route path="errands/:id/reviews/new" element={<ReviewCreatePage />} />
            <Route path="users/:userId" element={<PublicProfilePage />} />
            <Route path="my" element={<MyPage />} />
            <Route path="profile/edit" element={<ProfileEditPage />} />
            <Route path="my/errands" element={<MyErrandsPage />} />
            <Route path="my/inquiries" element={<InquiryListPage />} />
            <Route path="my/inquiries/new" element={<InquiryCreatePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:roomId" element={<ChatRoomPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
