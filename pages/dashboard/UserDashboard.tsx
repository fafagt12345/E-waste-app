import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService, Transaction, Announcement, EStore } from "../../services/db";
import { 
  Award, 
  QrCode, 
  Recycle, 
  Weight, 
  TrendingUp, 
  Megaphone,
  Sparkles,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Leaf
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast, Toaster } from "sonner";

export function UserDashboard() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const t = await dbService.getTransactions();
        const a = await dbService.getAnnouncements();
        setTransactions(t);
        setAnnouncements(a);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const myTxs = transactions.filter((t) => t.userId === profile?.uid || t.userId === "user-uid");
  const totalWeight = parseFloat(myTxs.reduce((sum, t) => sum + t.weight, 0).toFixed(2));
  const totalPoints = profile?.points ?? 480;
  
  // Calculate total carbon saved for this user
  const totalCarbon = parseFloat(myTxs.reduce((sum, t) => sum + t.carbonSaved, 0).toFixed(1));
  // Estimate trees equivalent: ~1 tree absorbs 22kg CO2 per year.
  const treeEquivalent = parseFloat((totalCarbon / 22).toFixed(1));

  // Preloaded Leaderboard Mock
  const leaderboard = [
    { name: "Rian Wijaya (Anda)", points: totalPoints, rank: 1, avatar: "https://ui-avatars.com/api/?name=Rian+Wijaya&background=16a34a&color=fff" },
    { name: "Deni Prasetyo", points: 420, rank: 2, avatar: "https://ui-avatars.com/api/?name=Deni+Prasetyo&background=0284c7&color=fff" },
    { name: "Siti Rahma", points: 310, rank: 3, avatar: "https://ui-avatars.com/api/?name=Siti+Rahma&background=eab308&color=fff" },
    { name: "Yusuf Al-Farabi", points: 280, rank: 4, avatar: "https://ui-avatars.com/api/?name=Yusuf+Al&background=4ade80&color=fff" }
  ].sort((a, b) => b.points - a.points);

  // User badges
  const availableBadges = [
    { name: "Eco Explorer", desc: "Setoran e-waste pertama", unlocked: true, icon: Leaf, color: "text-emerald-500 bg-emerald-50 border-emerald-200" },
    { name: "Eco Hero", desc: "Mengumpulkan lebih dari 200 poin", unlocked: totalPoints >= 200, icon: Sparkles, color: "text-amber-500 bg-amber-50 border-amber-200" },
    { name: "Green Champion", desc: "Mengurangi 20kg CO2 emisi", unlocked: totalCarbon >= 20, icon: Award, color: "text-sky-500 bg-sky-50 border-sky-200" }
  ];

  return (
    <div className="space-y-6 font-sans">
      <Toaster position="top-right" richColors />

      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dlh-green-600 via-dlh-green-500 to-dlh-blue-600 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              <Leaf className="h-3 w-3 text-dlh-yellow-300" /> Warga Peduli Lingkungan
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Halo, {profile?.fullName}!</h1>
            <p className="text-xs text-emerald-50 max-w-xl font-medium">
              Ayo terus kumpulkan sampah elektronik Anda, kumpulkan poin, dan tukarkan menjadi saldo token listrik PLN!
            </p>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white text-dlh-green-700 px-5 py-2.5 text-xs font-bold shadow-md hover:bg-slate-50 transition-all active:scale-95 shrink-0"
          >
            <QrCode className="h-4.5 w-4.5" /> QR Code Pribadi
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Poin Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Poin Anda</span>
            <div className="rounded-xl bg-dlh-yellow-50 p-2 text-dlh-yellow-600"><Sparkles className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-extrabold text-slate-800">{totalPoints} <span className="text-sm font-medium text-slate-400">Poin</span></h4>
            <Link to="/user/vouchers" className="text-[10px] font-bold text-dlh-blue-600 hover:underline mt-2 inline-flex items-center gap-0.5">
              Tukarkan Voucher Listrik <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Weight Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-Waste Terselamatkan</span>
            <div className="rounded-xl bg-dlh-green-50 p-2 text-dlh-green-600"><Weight className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-extrabold text-slate-800">{totalWeight} <span className="text-sm font-medium text-slate-400">kg</span></h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Total berat timbunan dari {myTxs.length} setoran</p>
          </div>
        </div>

        {/* Carbon Reduction Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reduksi Karbon CO2</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><Leaf className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-extrabold text-emerald-600">-{totalCarbon} <span className="text-sm font-medium text-slate-400">kg CO2</span></h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Setara menyerap emisi <strong>{treeEquivalent} pohon/tahun</strong></p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Achievements / Badges Panel */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800">Lencana Eco-Hero</h3>
            <p className="text-xs text-slate-500 font-medium">Lencana pencapaian peduli lingkungan Anda</p>
          </div>
          <div className="space-y-3">
            {availableBadges.map((b) => (
              <div 
                key={b.name} 
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  b.unlocked ? b.color : "bg-slate-50/50 border-slate-100 text-slate-400 opacity-60"
                }`}
              >
                <div className={`p-2.5 rounded-xl border ${b.unlocked ? "bg-white" : "bg-slate-100 text-slate-300"}`}>
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <span className="block text-xs font-extrabold truncate">{b.name}</span>
                  <span className="block text-[9px] font-semibold truncate">{b.desc}</span>
                </div>
                {b.unlocked && (
                  <ShieldCheck className="h-5 w-5 text-dlh-green-600 shrink-0 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Panel */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800">Leaderboard Eco Champion</h3>
            <p className="text-xs text-slate-500 font-medium">Penyetor teraktif berdasarkan perolehan poin</p>
          </div>
          <div className="space-y-2.5">
            {leaderboard.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50/50 transition-colors">
                <span className="w-5 text-center text-xs font-extrabold text-slate-400">#{idx + 1}</span>
                <img className="h-8 w-8 rounded-full border" src={item.avatar} alt="" />
                <span className="text-xs font-bold text-slate-700 flex-1 truncate">{item.name}</span>
                <span className="text-xs font-extrabold text-dlh-green-600 bg-dlh-green-50 px-2.5 py-0.5 rounded-full">
                  {item.points} P
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800">Pengumuman & Info</h3>
              <p className="text-xs text-slate-500 font-medium">Kabar terbaru dari Dinas Lingkungan Hidup</p>
            </div>
            <Megaphone className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {announcements.slice(0, 2).map((a) => (
              <div key={a.id} className="p-3 bg-slate-50/50 border rounded-2xl space-y-1">
                <span className="inline-flex text-[9px] font-extrabold uppercase bg-dlh-blue-50 text-dlh-blue-600 px-2 py-0.5 rounded">
                  {a.category}
                </span>
                <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{a.title}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recents Transactions for User */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-800 mb-4">Riwayat Setoran Anda</h3>
        
        {myTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada transaksi. Silakan serahkan sampah elektronik pertama Anda ke Bank Sampah terdekat!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-2">Tanggal</th>
                  <th className="py-2.5 px-2">Barang</th>
                  <th className="py-2.5 px-2">Kondisi</th>
                  <th className="py-2.5 px-2 text-center">Berat</th>
                  <th className="py-2.5 px-2 text-center">Poin</th>
                  <th className="py-2.5 px-3 text-right">Reduksi Karbon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                {myTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-slate-800">{tx.id}</td>
                    <td className="py-3 px-2 text-slate-400 font-medium">
                      {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3 px-2 text-slate-800">{tx.itemType} <span className="text-[10px] text-slate-400">({tx.brand})</span></td>
                    <td className="py-3 px-2">
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-extrabold">
                        {tx.damageLevel}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-800">{tx.weight} kg</td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex text-dlh-green-700 bg-dlh-green-50 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        +{tx.points} P
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-bold">{tx.carbonSaved} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MEMBER QR CODE CARD MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border text-center space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tunjukkan ke Petugas</span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600"><XIcon className="h-5 w-5" /></button>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-tr from-dlh-green-600 to-dlh-blue-600 p-4 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 h-16 w-16 bg-white/10 rounded-full blur-xl" />
              <span className="block text-[10px] font-bold text-emerald-100 uppercase tracking-widest text-left">MEMBER ECO CARD</span>
              <h4 className="text-md font-extrabold text-left mt-2">{profile?.fullName}</h4>
              <p className="text-[10px] text-emerald-50 text-left mt-1">UID: {profile?.uid || "user-uid"}</p>
            </div>

            <div className="mx-auto border p-4 bg-white rounded-2xl w-52 h-52 flex items-center justify-center shadow-inner">
              {/* Load a Google QR API image */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${profile?.uid || 'user-uid'}`} 
                alt="Member QR Code" 
                className="w-44 h-44" 
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              QR Code ini menyimpan ID unik Anda. Petugas akan memindai kode ini untuk mentransfer poin saat Anda menyetorkan sampah elektronik.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple close button helper
function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
