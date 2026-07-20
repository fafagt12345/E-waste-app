import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bell, UserCircle } from "lucide-react";

/**
 * Komponen Layout utama untuk semua halaman di dalam dashboard.
 * Berisi header dengan profil pengguna, notifikasi, dan merender konten halaman (via Outlet).
 */
export default function DashboardLayout() {
    const { profile, loading } = useAuth();
    const navigate = useNavigate();

    const handleProfileClick = () => {
        // Arahkan ke halaman profil pengguna
        if (profile?.role === 'user') {
            navigate('/user/profile');
        }
        // Anda bisa menambahkan logika untuk admin/petugas jika mereka punya halaman profil
    };

    const handleNotificationClick = () => {
        // Placeholder: Arahkan ke halaman notifikasi jika sudah ada
        // navigate('/notifications'); 
        alert("Halaman notifikasi sedang dalam pengembangan.");
    };

    if (loading) {
        return <div>Loading...</div>; // Atau tampilkan loading spinner
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header Dashboard */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">E-Waste Dashboard</h1>
                <div className="flex items-center gap-4">
                    <button onClick={handleNotificationClick} className="text-gray-600 hover:text-gray-900">
                        <Bell size={24} />
                    </button>
                    <button onClick={handleProfileClick} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <span className="font-semibold">{profile?.fullName}</span>
                        <UserCircle size={28} />
                    </button>
                </div>
            </header>

            {/* Konten Halaman */}
            <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                <Outlet /> {/* Di sinilah konten dari setiap halaman (misal: UserDashboard, ProfilePage) akan dirender */}
            </main>
        </div>
    );
}