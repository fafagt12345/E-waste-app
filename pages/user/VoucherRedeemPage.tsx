import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService, EStore, Voucher } from "../../services/db";
import { Ticket, Sparkles, AlertCircle, Copy, Check, Eye } from "lucide-react";
import { toast, Toaster } from "sonner";

export function VoucherRedeemPage() {
  const { profile } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [redeems, setRedeems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const v = await dbService.getVouchers();
      const r = await dbService.getRedeems();
      setVouchers(v);
      // Filter redemptions only for this user
      setRedeems(r.filter((item) => item.userId === profile?.uid || item.userId === "user-uid"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRedeem = async (voucherId: string) => {
    if (!profile) return;
    
    // Quick confirm popup
    const matchedV = vouchers.find(v => v.id === voucherId);
    if (!matchedV) return;

    if (profile.points < matchedV.cost) {
      toast.error("Poin Anda tidak mencukupi!");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menukarkan ${matchedV.cost} Poin dengan ${matchedV.title}?`)) {
      return;
    }

    try {
      const result = await dbService.redeemVoucher(
        profile.uid,
        profile.fullName,
        voucherId
      );

      if (result.success) {
        toast.success(`Redeem sukses! Token: ${result.code}`);
        // Reload context to reflect points deduct
        // We'll update the local state and trigger refresh
        loadData();
        // Since we are running in local sync, let's force-reload or update window profile state manually
        // If Firebase auth is loaded, Firestore updates. For local simulation:
        const users = EStore.getUsers();
        const me = users.find(u => u.uid === profile.uid);
        if (me) {
          profile.points = me.points;
        }
      } else {
        toast.error(result.message || "Gagal melakukan penukaran");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem penukaran");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Kode token disalin!");
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Tukar Poin E-Waste</h1>
          <p className="text-sm text-slate-500 font-medium">Tukarkan poin Anda menjadi voucher token listrik PLN prabayar resmi Dinas Lingkungan Hidup.</p>
        </div>

        <div className="rounded-2xl bg-dlh-green-50 border border-dlh-green-100 px-5 py-2.5 text-center flex items-center gap-2 shadow-sm shrink-0">
          <Sparkles className="h-5 w-5 text-dlh-yellow-500 animate-pulse" />
          <span className="text-xs text-slate-500 font-semibold">Poin Anda:</span>
          <span className="text-sm font-extrabold text-dlh-green-700 bg-white border border-dlh-green-100 px-2.5 py-0.5 rounded-full">
            {profile?.points ?? 480} Poin
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Vouchers Catalog Grid */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pilihan Voucher Listrik PLN</h3>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {vouchers.map((v) => {
                const canAfford = (profile?.points ?? 0) >= v.cost;
                const isOutOfStock = v.stock <= 0;
                
                return (
                  <div key={v.id} className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative">
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-extrabold text-xs uppercase px-3 py-1 rounded-full shadow-md">Stok Habis</span>
                      </div>
                    )}
                    
                    {/* Voucher Header Design */}
                    <div className="bg-gradient-to-tr from-dlh-green-600 to-dlh-blue-600 p-5 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">VOUCHER LISTRIK PRABAYAR</span>
                      <h4 className="text-lg font-extrabold mt-1">{v.title}</h4>
                      <p className="text-xs text-emerald-50 mt-0.5">Nilai Kwh: Rp {v.value.toLocaleString("id-ID")}</p>
                    </div>

                    {/* Voucher Info & Button */}
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Stok tersedia: <strong>{v.stock} unit</strong></span>
                        <span className="font-extrabold text-dlh-green-600 bg-dlh-green-50 px-2.5 py-0.5 rounded-full">
                          {v.cost} POIN
                        </span>
                      </div>

                      <button
                        onClick={() => handleRedeem(v.id)}
                        disabled={!canAfford || isOutOfStock}
                        className={`w-full h-11 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                          canAfford 
                            ? "bg-dlh-green-600 hover:bg-dlh-green-700 text-white" 
                            : "bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed shadow-none"
                        }`}
                      >
                        <Ticket className="h-4.5 w-4.5" /> Tukar Sekarang
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redemptions Token History Panel */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kupon Token Penukaran Anda</h3>
            
            <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4 max-h-[420px] overflow-y-auto">
              {redeems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="h-8 w-8 text-slate-300" />
                  Belum ada voucher yang ditukarkan.
                </div>
              ) : (
                <div className="space-y-4">
                  {redeems.map((red) => (
                    <div key={red.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                        <span>{new Date(red.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-dlh-green-600">-{red.cost} P</span>
                      </div>
                      
                      <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{red.voucherTitle}</h4>
                      
                      {/* Copy Code box */}
                      <div className="flex gap-1.5 bg-white border border-slate-200 p-2 rounded-xl items-center justify-between shadow-inner">
                        <code className="text-[10px] font-bold text-slate-700 font-mono select-all truncate">{red.code}</code>
                        <button
                          onClick={() => handleCopyCode(red.code)}
                          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg shrink-0 transition-colors"
                        >
                          {copiedCode === red.code ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
