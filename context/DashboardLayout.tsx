import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bell, UserCircle } from "lucide-react";
import SidebarMenu from "../components/SidebarMenu";

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
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <div className="hidden border-r border-slate-200 lg:block">
                <SidebarMenu />
            </div>

            {/* Konten Utama */}
            <div className="flex flex-col">
                {/* Header Dashboard */}
                <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
                    <h1 className="text-xl font-bold text-gray-800 flex-1">E-Waste Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={handleNotificationClick} className="text-gray-600 hover:text-gray-900">
                            <Bell size={24} />
                        </button>
                        <button
                            onClick={handleProfileClick}
                            className="flex items-center gap-2 rounded-full p-1 pr-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            aria-label="Buka profil pengguna"
                        >
                            {profile?.photoProfile ? (
                                <img src={profile.photoProfile} alt="Foto Profil" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                                <UserCircle size={28} className="h-8 w-8" />
                            )}
                            <span className="font-semibold text-sm">{profile?.fullName}</span>
                        </button>
                    </div>
                </header>

                {/* Konten Halaman */}
                <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                    <Outlet /> {/* Di sinilah konten dari setiap halaman (misal: UserDashboard, ProfilePage) akan dirender */}
                </main>
            </div>
        </div>
    );
}