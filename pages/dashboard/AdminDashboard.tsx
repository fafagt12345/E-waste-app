import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService, Transaction, UserProfile, Voucher } from "../../services/db";
import { 
  Users, 
  HardHat, 
  Recycle, 
  Weight, 
  Award, 
  Ticket, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";

export function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = await dbService.getUsers();
        const t = await dbService.getTransactions();
        const v = await dbService.getVouchers();
        setUsers(u);
        setTransactions(t);
        setVouchers(v);
      } catch (e) {
        console.error("Failed loading dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 w-3/4 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ANALYTICS & MATH
  // -------------------------------------------------------------
  const totalUsers = users.filter((u) => u.role === "user").length;
  const totalOfficers = users.filter((u) => u.role === "petugas").length;
  const totalItems = transactions.length;
  const totalWeight = parseFloat(transactions.reduce((acc, t) => acc + t.weight, 0).toFixed(2));
  const totalPoints = transactions.reduce((acc, t) => acc + t.points, 0);
  const totalVouchersRedeemed = JSON.parse(localStorage.getItem("ew_redeems") || "[]").length;

  // Daily & Monthly Filter
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const txToday = transactions.filter((t) => t.date.startsWith(todayStr));
  const txThisMonth = transactions.filter((t) => t.date.includes(thisMonthStr));

  // Graph Data 1: Monthly Transactions Trend (Area Chart)
  // Let's group transactions by date for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const transactionTrendData = last7Days.map((date) => {
    const dayTxs = transactions.filter((t) => t.date.startsWith(date));
    return {
      date: date.split("-").slice(2).join("/"), // DD
      "Transaksi": dayTxs.length,
      "Poin": dayTxs.reduce((sum, t) => sum + t.points, 0),
      "Berat (kg)": parseFloat(dayTxs.reduce((sum, t) => sum + t.weight, 0).toFixed(1))
    };
  });

  // Graph Data 2: Item Categories Breakdown (Pie Chart)
  const categoryCounts: Record<string, number> = {};
  transactions.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryCounts).map((cat) => ({
    name: cat.split(" / ")[0],
    value: categoryCounts[cat]
  }));

  // Graph Data 3: Brands Distribution (Bar Chart)
  const brandCounts: Record<string, number> = {};
  transactions.forEach((t) => {
    brandCounts[t.brand] = (brandCounts[t.brand] || 0) + 1;
  });
  const brandData = Object.keys(brandCounts).map((b) => ({
    name: b,
    "Jumlah": brandCounts[b]
  })).slice(0, 7); // Top 7

  // Graph Data 4: Physical Conditions (Donut Chart)
  const conditionCounts: Record<string, number> = {};
  transactions.forEach((t) => {
    conditionCounts[t.damageLevel] = (conditionCounts[t.damageLevel] || 0) + 1;
  });
  const conditionData = Object.keys(conditionCounts).map((cond) => ({
    name: cond,
    value: conditionCounts[cond]
  }));

  // Graph Data 5: Officer Performance (Horizontal Bar Chart)
  const officerCounts: Record<string, number> = {};
  transactions.forEach((t) => {
    officerCounts[t.officerName.split(" ")[0]] = (officerCounts[t.officerName.split(" ")[0]] || 0) + 1;
  });
  const officerData = Object.keys(officerCounts).map((name) => ({
    name,
    "Transaksi": officerCounts[name]
  }));

  const COLORS = ["#16a34a", "#0284c7", "#eab308", "#ef4444", "#a855f7", "#3b82f6"];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dlh-green-700 via-dlh-green-600 to-dlh-blue-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[url('https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=500&auto=format&fit=crop&q=60')] opacity-10 bg-cover bg-center pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-dlh-yellow-300 animate-pulse" />
            Sistem Pemantauan Pusat DLH
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Ringkasan Admin</h1>
          <p className="max-w-2xl text-sm text-emerald-50">
            Selamat datang kembali, <strong className="text-white">{profile?.fullName}</strong>. Pantau metrik penukaran sampah elektronik, kinerja petugas, dan efisiensi konversi poin secara real-time.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Penyetor</span>
              <p className="text-3xl font-extrabold text-slate-800">{totalUsers}</p>
            </div>
            <div className="rounded-2xl bg-dlh-yellow-50 p-3 text-dlh-yellow-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-dlh-green-600 font-bold">
            <span>Aktif menyetor sampah elektronik</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Petugas</span>
              <p className="text-3xl font-extrabold text-slate-800">{totalOfficers}</p>
            </div>
            <div className="rounded-2xl bg-dlh-green-50 p-3 text-dlh-green-600">
              <HardHat className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-dlh-green-600 font-bold">
            <span>Staf lapangan di Bank Sampah</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sampah Masuk</span>
              <p className="text-3xl font-extrabold text-slate-800">{totalItems} <span className="text-sm font-medium text-slate-400">Unit</span></p>
            </div>
            <div className="rounded-2xl bg-dlh-blue-50 p-3 text-dlh-blue-600">
              <Recycle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-slate-500">Hari ini: <strong>{txToday.length} unit</strong></span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Bulan ini: <strong>{txThisMonth.length} unit</strong></span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Berat Sampah</span>
              <p className="text-3xl font-extrabold text-slate-800">{totalWeight} <span className="text-sm font-medium text-slate-400">kg</span></p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <Weight className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-slate-500">Poin Beredar: <strong>{totalPoints} Poin</strong></span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Voucher ditukar: <strong>{totalVouchersRedeemed}x</strong></span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trend Area Chart */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800">Tren Transaksi & Volume Sampah</h3>
              <p className="text-xs text-slate-500">Statistik aktivitas penyetoran 7 hari terakhir</p>
            </div>
            <div className="rounded-lg bg-dlh-green-50 p-2 text-dlh-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTxs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Area type="monotone" dataKey="Transaksi" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorTxs)" />
                <Area type="monotone" dataKey="Berat (kg)" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800">Komposisi Jenis Barang</h3>
            <p className="text-xs text-slate-500">Distribusi sampah berdasarkan kategori utama</p>
          </div>
          <div className="h-72 flex flex-col sm:flex-row items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-center text-slate-400 text-sm">Belum ada data barang</div>
            ) : (
              <>
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 px-4">
                  {categoryData.map((cat, index) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-semibold text-slate-600">{cat.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{cat.value} unit</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Brand Bar Chart */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 md:col-span-2">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800">Merek E-Waste Terpopuler</h3>
            <p className="text-xs text-slate-500">Merek barang elektronik yang paling sering disetorkan</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Jumlah" fill="#0284c7" radius={[8, 8, 0, 0]}>
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0284c7" : "#16a34a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Damage Conditions Donut */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800">Kondisi Fisik Barang</h3>
            <p className="text-xs text-slate-500">Tingkat kerusakan barang saat masuk</p>
          </div>
          <div className="h-64 flex flex-col items-center justify-center">
            {conditionData.length === 0 ? (
              <div className="text-center text-slate-400 text-sm">Belum ada data kondisi</div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conditionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {conditionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-[10px] px-2 mt-2">
                  {conditionData.map((cond, index) => (
                    <div key={cond.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                      <span className="truncate text-slate-600">{cond.name}: <strong>{cond.value}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Officer Activity Stats */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 md:col-span-1">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800">Aktivitas Petugas</h3>
            <p className="text-xs text-slate-500">Jumlah transaksi yang dilayani masing-masing petugas</p>
          </div>
          <div className="h-56">
            {officerData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada aktivitas petugas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={officerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="Transaksi" fill="#eab308" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions List on Admin */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800">Aktivitas Transaksi Terbaru</h3>
              <p className="text-xs text-slate-500">Setoran e-waste terakhir dari seluruh cabang</p>
            </div>
            <a href="/admin/reports" className="flex items-center gap-1 text-xs font-bold text-dlh-green-600 hover:text-dlh-green-700">
              Semua Laporan <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-1">ID</th>
                  <th className="py-3 px-2">Tanggal</th>
                  <th className="py-3 px-2">Penyetor</th>
                  <th className="py-3 px-2">Barang</th>
                  <th className="py-3 px-2">Poin</th>
                  <th className="py-3 px-2 text-right">Berat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.slice(0, 4).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-1 font-bold text-slate-600">{tx.id}</td>
                    <td className="py-3 px-2 text-slate-500">{new Date(tx.date).toLocaleDateString("id-ID", {day: "numeric", month: "short"})}</td>
                    <td className="py-3 px-2 font-semibold text-slate-800">{tx.userName.split(" ")[0]}</td>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-slate-800">{tx.itemType}</span>{" "}
                      <span className="text-[10px] text-slate-400 font-medium">({tx.brand})</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1 font-extrabold text-dlh-green-600 bg-dlh-green-50 px-2 py-0.5 rounded-full">
                        +{tx.points} P
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-700">{tx.weight} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
