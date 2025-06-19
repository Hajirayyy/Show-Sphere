import React from 'react';
import { Routes, Route } from 'react-router-dom';

/* ── Auth pages ── */
import StartPage              from './pages/Auth/StartPage';    
import LoginPage              from './pages/Auth/LoginPage';
import SignupPage             from './pages/Auth/SignupPage';
import ResetPasswordPage      from './pages/Auth/ResetPasswordPage';
import ResetPasswordFormPage  from './pages/Auth/ResetPassRequestPage';

/* ── Dashboards ── */
import UserDashboard  from './pages/User/UserDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';

/* ── Movies / booking ── */
import MovieListPage   from './pages/Movies/MovieListPage';
import MovieDetailPage from './pages/Movies/MovieDetailPage';
import ReceiptPage     from './pages/User/ReceiptPage';

/* ── User‑specific pages ── */
import BookingHistory  from './pages/User/BookingHistory';
import ReviewPage      from './pages/User/AddReview';
import DeleteAccountPage from './pages/User/DeleteAccountPage';

/* ── Misc ── */
import NotFoundPage    from './pages/Home/NotFoundPage';
import ProtectedRoute  from './components/ProtectedRoute';

const RoutesHandler = () => (
  <Routes>
    {/* ---------- Public / Auth ---------- */}
    <Route path="/"          element={<StartPage />} />      
    <Route path="/login"     element={<LoginPage />} />
    <Route path="/signup"    element={<SignupPage />} />
    <Route path="/reset-password"      element={<ResetPasswordPage />} />
    <Route path="/reset-password/new"  element={<ResetPasswordFormPage />} />

    {/* ---------- Public content ---------- */}
    <Route path="/movies"       element={<MovieListPage />} />
    <Route path="/movies/:id"   element={<MovieDetailPage />} />

    {/* Payment receipt (public so redirect works) */}
    <Route path="/receipt/:id"  element={<ReceiptPage />} />

    {/* ---------- Protected: User ---------- */}
    <Route path="/review/:movieId"
      element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />

    <Route path="/bookings"
      element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />

    <Route path="/delete-account" 
      element={<ProtectedRoute><DeleteAccountPage /></ProtectedRoute>} />


    <Route path="/user/*"
      element={<ProtectedRoute role="User"><UserDashboard /></ProtectedRoute>} />

    {/* ---------- Protected: Admin ---------- */}
    <Route path="/admin/*"
      element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />

    {/* ---------- 404 fallback ---------- */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default RoutesHandler;
