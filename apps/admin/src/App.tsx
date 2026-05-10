import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { InquiryListPage } from './pages/admin/InquiryListPage';
import { InquiryDetailPage } from './pages/admin/InquiryDetailPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/inquiries"
          element={
            <ProtectedRoute>
              <InquiryListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inquiries/:inquiryId"
          element={
            <ProtectedRoute>
              <InquiryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
