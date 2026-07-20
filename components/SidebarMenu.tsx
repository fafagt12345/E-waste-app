import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    Upload,
    Ticket,
    BookOpen,
    Map,
    LogOut,
    Briefcase,
    BarChart3,
    Settings,
    Truck,
} from "lucide-react";

const userMenu = [
    { to: "/dashboard/user", text: "Dashboard", icon: LayoutDashboard },
    { to: "/user/submit-item", text: "Setor Sampah", icon: Upload },
    { to: "/user/vouchers", text: "Tukar Poin", icon: Ticket },
    { to: "/user/education", text: "Edukasi", icon: BookOpen },
    { to: "/user/map", text: "Peta Bank Sampah", icon: Map },
];

const adminMenu = [
    { to: "/dashboard/admin", text: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/management", text: "Manajemen Data", icon: Briefcase },
    { to: "/admin/reports", text: "Laporan", icon: BarChart3 },
    { to: "/admin/settings", text: "Pengaturan Sistem", icon: Settings },
];

const officerMenu = [
    { to: "/dashboard/petugas", text: "Dashboard", icon: LayoutDashboard },
    { to: "/petugas/transaction", text: "Transaksi Baru", icon: Ticket },
    { to: "/petugas/checkin", text: "Check-in Booking", icon: Truck },
];

const NavItem = ({ to, text, icon: Icon }: { to: string, text: string, icon: React.ElementType }) => (
    <NavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive
                ? "bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 text-white shadow-lg"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`
        }
    >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{text}</span>
    </NavLink>
);

export default function SidebarMenu() {
    const { profile, logout } = useAuth();

    // Tentukan menu berdasarkan peran pengguna
    let menuItems = [];
    if (profile?.role === "user") {
        menuItems = userMenu;
    } else if (profile?.role === "admin") {
        menuItems = adminMenu;
    } else if (profile?.role === "petugas") {
        menuItems = officerMenu;
    }

    return (
        <div className="flex h-full max-h-screen flex-col gap-2 bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="flex h-16 items-center border-b border-slate-700 px-6">
                <h2 className="text-lg font-bold text-white">Menu Navigasi</h2>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {menuItems.map((item) => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t border-slate-700">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:bg-red-900/50 hover:text-red-400"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Keluar</span>
                </button>
            </div>
        </div>
    );
}