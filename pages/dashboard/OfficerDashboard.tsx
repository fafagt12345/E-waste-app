import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService, Transaction } from "../../services/db";
import { ArrowRight, QrCode, Users, Weight, RefreshCw, Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast, Toaster } from "sonner";

export function OfficerDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getTransactions();
      setTransactions(data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat dashboard petugas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling for real-time updates
    return () => clearInterval(interval);
  }, []);

  // Today's Date String
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Filter transactions handled by this specific officer
  const myTransactions = transactions.filter(t => t.officerId === profile?.uid || t.officerId === "officer-uid");
  const todayTransactions = myTransactions.filter((t) => t.date.startsWith(todayStr));

  // Compute stats
  const totalTodayCount = todayTransactions.length;
  const totalTodayWeight = parseFloat(todayTransactions.reduce((acc, t) => acc + t.weight, 0).toFixed(2));
  const totalTodayPoints = todayTransactions.reduce((acc, t) => acc + t.points, 0);
  const totalUsersServedToday = new Set(todayTransactions.map((t) => t.userId)).size;

  return (
    <div className="space-y-6 font-sans">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Dashboard Petugas Lapangan</h1>
          <p className="text-sm text-slate-500">Halo, <strong className="text-slate-700">{profile?.fullName}</strong>. Siap melayani setoran sampah elektronik hari ini.</p>
        </div>
        <Link
          to="/petugas/transaction"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <QrCode className="h-5 w-5" /> Input Setoran Baru <ArrowRight size={18} />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <>
          {/* Daily Stats Widgets */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Setoran Hari Ini</span>
                <div className="rounded-xl bg-dlh-green-50 p-2 text-dlh-green-600"><Calendar className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-slate-800">{totalTodayCount} <span className="text-sm font-medium text-slate-400">Barang</span></h4>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Tercatat di sistem hari ini</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Berat Hari Ini</span>
                <div className="rounded-xl bg-dlh-blue-50 p-2 text-dlh-blue-600"><Weight className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-slate-800">{totalTodayWeight} <span className="text-sm font-medium text-slate-400">kg</span></h4>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Total berat timbangan e-waste</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Poin Disalurkan</span>
                <div className="rounded-xl bg-dlh-yellow-50 p-2 text-dlh-yellow-600"><Sparkles className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-slate-800">+{totalTodayPoints} <span className="text-sm font-medium text-slate-400">Poin</span></h4>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Poin yang dikonversi ke penyetor</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penyetor Dilayani</span>
                <div className="rounded-xl bg-slate-50 p-2 text-slate-500"><Users className="h-5 w-5" /></div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-slate-800">{totalUsersServedToday} <span className="text-sm font-medium text-slate-400">Orang</span></h4>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Akun warga yang disorot QR</p>
              </div>
            </div>
          </div>

          {/* History handled by this officer */}
          <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800">Riwayat Penyetoran Yang Anda Layani</h3>
                <p className="text-xs text-slate-500 font-medium">Daftar transaksi e-waste terverifikasi yang Anda input</p>
              </div>
              <button onClick={loadData} className="p-2 border border-slate-100 hover:bg-slate-50 rounded-xl transition-all">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {myTransactions.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="font-semibold">Belum ada transaksi</p>
                <p className="text-xs">Klik tombol "Input Setoran Baru" di kanan atas untuk memulai.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 rounded-l-2xl">ID</th>
                      <th className="py-3 px-2">Tanggal</th>
                      <th className="py-3 px-2">Penyetor</th>
                      <th className="py-3 px-2">Barang</th>
                      <th className="py-3 px-2">Kondisi</th>
                      <th className="py-3 px-2">Berat</th>
                      <th className="py-3 px-2">Poin</th>
                      <th className="py-3 px-4 text-right rounded-r-2xl">Karbon Terkurangi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                    {myTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 text-slate-800">{tx.id}</td>
                        <td className="py-3.5 px-2 text-slate-500 font-medium">{new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-3.5 px-2 text-slate-800">{tx.userName}</td>
                        <td className="py-3.5 px-2 text-slate-800">{tx.itemType} <span className="text-[10px] text-slate-400">({tx.brand})</span></td>
                        <td className="py-3.5 px-2">
                          <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {tx.damageLevel}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-slate-800">{tx.weight} kg</td>
                        <td className="py-3.5 px-2">
                          <span className="inline-flex items-center gap-1 text-dlh-green-700 bg-dlh-green-50 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                            +{tx.points} P
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-dlh-green-600 font-bold">{tx.carbonSaved} kg CO2</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
