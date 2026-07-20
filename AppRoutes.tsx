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

function DashboardRoutes() {
    return (
        <ProtectedRoute>
            <DashboardLayout />
        </ProtectedRoute>
    )
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

                    {/* Rute yang Dilindungi (menggunakan DashboardLayout) */}
                    <Route path="/" element={<DashboardRoutes />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardRedirect />} />
                        
                        {/* Admin Routes */}
                        <Route path="dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="admin/management" element={<ProtectedRoute allowedRoles={["admin"]}><AdminManagement /></ProtectedRoute>} />
                        <Route path="admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
                        <Route path="admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSystem /></ProtectedRoute>} />
                        
                        {/* Petugas / Officer Routes */}
                        <Route path="dashboard/petugas" element={<ProtectedRoute allowedRoles={["petugas"]}><OfficerDashboard /></ProtectedRoute>} />
                        <Route path="petugas/transaction" element={<ProtectedRoute allowedRoles={["petugas"]}><TransactionPage /></ProtectedRoute>} />
                        <Route path="petugas/checkin" element={<ProtectedRoute allowedRoles={["petugas"]}><BookingCheckinPage /></ProtectedRoute>} />
                        
                        {/* User / Penyetor Routes */}
                        <Route path="dashboard/user" element={<ProtectedRoute allowedRoles={["user"]}><UserDashboard /></ProtectedRoute>} />
                        <Route path="user/profile" element={<ProtectedRoute allowedRoles={["user"]}><ProfilePage /></ProtectedRoute>} />
                        <Route path="user/submit-item" element={<ProtectedRoute allowedRoles={["user"]}><SubmitItemPage /></ProtectedRoute>} />
                        <Route path="user/vouchers" element={<ProtectedRoute allowedRoles={["user"]}><VoucherRedeemPage /></ProtectedRoute>} />
                        <Route path="user/education" element={<ProtectedRoute allowedRoles={["user"]}><EducationPage /></ProtectedRoute>} />
                        <Route path="user/map" element={<ProtectedRoute allowedRoles={["user"]}><WasteBankMapPage /></ProtectedRoute>} />
                    </Route>

                    {/* Halaman fallback untuk rute yang tidak cocok */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default AppRoutes;