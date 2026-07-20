import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AdminDashboard } from "./pages/dashboard/AdminDashboard";
import { OfficerDashboard } from "./pages/dashboard/OfficerDashboard";
import { UserDashboard } from "./pages/dashboard/UserDashboard";
import { AdminManagement } from "./pages/dashboard/AdminManagement";
import { AdminReports } from "./pages/dashboard/AdminReports";
import { AdminSystem } from "./pages/dashboard/AdminSystem";
import { TransactionPage } from "./pages/petugas/TransactionPage";
import { BookingCheckinPage } from "./pages/petugas/BookingCheckinPage";
import { ProfilePage } from "./pages/user/ProfilePage";
import { SubmitItemPage } from "./pages/user/SubmitItemPage";
import { VoucherRedeemPage } from "./pages/user/VoucherRedeemPage";
import { EducationPage } from "./pages/user/EducationPage";
import { WasteBankMapPage } from "./pages/user/WasteBankMapPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import DashboardLayout from "./components/DashboardLayout";

function DashboardRedirect() {
    const { profile, loading } = useAuth();

    if (loading) return <LoadingSpinner />;
    if (!profile) return <Navigate to="/login" replace />;

    if (profile.role === "admin") return <Navigate to="/dashboard/admin" replace />;
    if (profile.role === "petugas") return <Navigate to="/dashboard/petugas" replace />;
    return <Navigate to="/dashboard/user" replace />;
}

function AppRoutes() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Rute Publik */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/daftar" element={<RegisterPage />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />

                    {/* Rute yang Dilindungi menggunakan Layout Dashboard */}
                    <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        {/* Rute Indeks: Arahkan ke dashboard yang sesuai */}
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardRedirect />} />

                        {/* Admin Routes */}
                        <Route path="dashboard/admin" element={<AdminDashboard />} />
                        <Route path="admin/management" element={<AdminManagement />} />
                        <Route path="admin/reports" element={<AdminReports />} />
                        <Route path="admin/settings" element={<AdminSystem />} />

                        {/* Petugas / Officer Routes */}
                        <Route path="dashboard/petugas" element={<OfficerDashboard />} />
                        <Route path="petugas/transaction" element={<TransactionPage />} />
                        <Route path="petugas/checkin" element={<BookingCheckinPage />} />

                        {/* User / Penyetor Routes */}
                        <Route path="dashboard/user" element={<UserDashboard />} />
                        <Route path="user/profile" element={<ProfilePage />} />
                        <Route path="user/submit-item" element={<SubmitItemPage />} />
                        <Route path="user/vouchers" element={<VoucherRedeemPage />} />
                        <Route path="user/education" element={<EducationPage />} />
                        <Route path="user/map" element={<WasteBankMapPage />} />
                    </Route>

                    {/* Halaman fallback untuk rute yang tidak cocok */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default AppRoutes;