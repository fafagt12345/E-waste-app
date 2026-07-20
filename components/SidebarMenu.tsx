import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    User,
    Upload,
    Ticket,
    BookOpen,
    Map,
    LogOut,
} from "lucide-react";

const userMenu = [
    { to: "/dashboard/user", text: "Dashboard", icon: LayoutDashboard },
    { to: "/user/profile", text: "Profil Saya", icon: User },
    { to: "/user/submit-item", text: "Setor Sampah", icon: Upload },
    { to: "/user/vouchers", text: "Tukar Poin", icon: Ticket },
    { to: "/user/education", text: "Edukasi", icon: BookOpen },
    { to: "/user/map", text: "Peta Bank Sampah", icon: Map },
];

// Anda bisa menambahkan menu untuk admin dan petugas di sini
// const adminMenu = [ ... ];
// const officerMenu = [ ... ];

const NavItem = ({ to, text, icon: Icon }: { to: string, text: string, icon: React.ElementType }) => (
    <NavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive
                ? "bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
    const menuItems = profile?.role === "user" ? userMenu : [];
    // if (profile?.role === 'admin') menuItems = adminMenu;
    // if (profile?.role === 'petugas') menuItems = officerMenu;

    return (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
                <h2 className="text-lg font-bold text-dlh-green-700">Menu Navigasi</h2>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {menuItems.map((item) => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Keluar</span>
                </button>
            </div>
        </div>
    );
}