import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { aiService } from "../services/aiService";
import {
  LayoutDashboard,
  Users,
  Truck,
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
  ChevronDown,
  BarChart3,
  Ticket,
  MessageSquare,
  Send,
  Sparkles,
  MapPin,
  BookOpen,
  Briefcase,
  Loader2
} from "lucide-react";

const adminNav = [
  { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Manajemen Data", href: "/admin/management", icon: Briefcase },
  { name: "Ekspor Laporan", href: "/admin/reports", icon: BarChart3 },
  { name: "Keamanan & Pengaturan", href: "/admin/settings", icon: Settings },
];

const officerNav = [
  { name: "Dashboard", href: "/dashboard/petugas", icon: LayoutDashboard },
  { name: "Antrean Booking", href: "/petugas/checkin", icon: Truck },
  { name: "Transaksi Baru", href: "/petugas/transaction", icon: Ticket },
];

const userNav = [
  { name: "Dashboard", href: "/dashboard/user", icon: LayoutDashboard },
  { name: "Booking Penyetoran", href: "/user/submit-item", icon: Truck },
  { name: "Tukar Voucher", href: "/user/vouchers", icon: Ticket },
  { name: "Peta Unit DLH", href: "/user/map", icon: MapPin },
  { name: "Edukasi E-Waste", href: "/user/education", icon: BookOpen },
];

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  time: string;
}

export default function DashboardLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: "bot", text: "Halo! Saya adalah Asisten AI E-Waste DLH. Tanyakan apa saja tentang poin, voucher PLN, atau tata cara pemilahan sampah elektronik.", time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems =
    profile?.role === "admin"
      ? adminNav
      : profile?.role === "petugas"
      ? officerNav
      : userNav;

  const handleSendChat = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { sender: "user", text: textToSend, time: timeStr };
    
    setChatHistory((prev) => [...prev, userMsg]);
    setInputMsg("");
    setIsTyping(true);

    try {
      const reply = await aiService.getChatbotReply(textToSend);
      const botMsg: ChatMessage = { sender: "bot", text: reply, time: timeStr };
      setChatHistory((prev) => [...prev, botMsg]);
    } catch (e) {
      const errMsg: ChatMessage = { sender: "bot", text: "Maaf, koneksi AI sedang mengalami gangguan.", time: timeStr };
      setChatHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-[#0F172A] to-[#1E293B] px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-dlh-green-500 to-dlh-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-dlh-green-600/30 text-base">E</div>
        <h1 className="text-xl font-extrabold text-white tracking-wide">
          E-Waste <span className="text-dlh-green-400">Exchange</span>
        </h1>
      </div>
      
      <nav className="flex flex-1 flex-col mt-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-2xl p-2.5 text-xs leading-6 font-bold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-dlh-green-600 to-dlh-green-700 text-white shadow-md shadow-dlh-green-600/10"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>

          {/* User profile brief card in sidebar */}
          <li className="mt-auto border-t border-white/5 pt-4">
            <div className="flex items-center gap-3 px-1 mb-4">
              <img 
                className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700" 
                src={profile?.photoProfile || `https://ui-avatars.com/api/?name=${profile?.fullName}&background=22c55e&color=fff`} 
                alt="" 
              />
              <div className="truncate">
                <span className="block text-xs font-bold text-slate-200 truncate">{profile?.fullName}</span>
                <span className="block text-[9px] font-semibold text-slate-400 capitalize">{profile?.role}</span>
              </div>
            </div>
            <a
              href="#"
              onClick={handleLogout}
              className="group -mx-2 flex gap-x-3 rounded-2xl p-2.5 text-xs font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-red-400" />
              Keluar Sesi
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Mobile sidebar modal */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-100 bg-white/80 backdrop-blur-md px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-slate-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="h-6 w-px bg-slate-200 lg:hidden" aria-hidden="true" />
          
          {/* Topbar elements */}
          <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="p-2 text-slate-400 hover:text-slate-500 rounded-xl hover:bg-slate-50 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

              <div className="flex items-center gap-x-2">
                <img 
                  className="h-8 w-8 rounded-full border bg-slate-50" 
                  src={profile?.photoProfile || `https://ui-avatars.com/api/?name=${profile?.fullName}&background=22c55e&color=fff`} 
                  alt="" 
                />
                <span className="hidden lg:inline text-xs font-bold text-slate-700">{profile?.fullName}</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-dlh-green-600 bg-dlh-green-50 px-2 py-0.5 rounded-full border border-dlh-green-100">{profile?.role}</span>
              </div>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* -------------------------------------------------------------
          FLOATING CHATBOT WIDGET
          ------------------------------------------------------------- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="mb-4 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[480px] animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 px-4 py-3 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5 text-dlh-yellow-300 animate-pulse" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Asisten AI E-Waste DLH</h4>
                  <span className="text-[9px] text-emerald-100 font-semibold">Online & Aktif</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-dlh-green-600 text-white rounded-tr-none shadow-sm" 
                      : "bg-white border text-slate-800 rounded-tl-none shadow-xs font-medium"
                  }`}>
                    {msg.text}
                    <span className={`block text-[8px] mt-1 text-right ${msg.sender === "user" ? "text-emerald-200" : "text-slate-400"}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border text-slate-500 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-1.5 shadow-xs">
                    <Loader2 className="h-3 w-3 animate-spin text-dlh-green-600" />
                    <span>AI sedang mengetik...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Preset chips */}
            <div className="p-2 bg-slate-50 border-t flex gap-1.5 overflow-x-auto whitespace-nowrap shrink-0">
              <button 
                onClick={() => handleSendChat("Bagaimana cara menghitung poin?")}
                className="px-3 py-1 rounded-full bg-white border text-[10px] font-bold text-slate-600 hover:border-dlh-green-500 transition-all shrink-0"
              >
                Rumus Poin
              </button>
              <button 
                onClick={() => handleSendChat("Apa saja voucher yang tersedia?")}
                className="px-3 py-1 rounded-full bg-white border text-[10px] font-bold text-slate-600 hover:border-dlh-green-500 transition-all shrink-0"
              >
                Voucher PLN
              </button>
              <button 
                onClick={() => handleSendChat("Di mana lokasi bank sampah?")}
                className="px-3 py-1 rounded-full bg-white border text-[10px] font-bold text-slate-600 hover:border-dlh-green-500 transition-all shrink-0"
              >
                Lokasi Unit
              </button>
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendChat(inputMsg); }}
              className="p-3 border-t bg-white flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Tanyakan sesuatu..."
                className="flex-1 h-9 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none"
              />
              <button type="submit" className="h-9 w-9 bg-dlh-green-600 hover:bg-dlh-green-700 text-white rounded-xl flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95">
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble Icon */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-dlh-green-600 to-dlh-blue-600 text-white shadow-xl hover:shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative border border-white/10"
        >
          {chatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          
          {!chatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dlh-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-dlh-yellow-500 text-[8px] font-bold items-center justify-center text-slate-900 border border-white shadow-xs">AI</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}