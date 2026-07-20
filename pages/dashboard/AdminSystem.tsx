import { useState, useEffect } from "react";
import { EStore, dbService, DamageLevel, AuditLog } from "../../services/db";
import { 
  Settings, 
  Database, 
  ClipboardList, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  RotateCcw,
  ShieldAlert
} from "lucide-react";
import { toast, Toaster } from "sonner";

export function AdminSystem() {
  const [damageLevels, setDamageLevels] = useState<DamageLevel[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load configuration and audit trail
  const loadData = () => {
    setLoading(true);
    setDamageLevels(EStore.getDamageLevels());
    setAuditLogs(EStore.getAuditLogs());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMultiplierChange = (id: string, newMultiplier: number) => {
    const updated = damageLevels.map((dl) => 
      dl.id === id ? { ...dl, multiplier: parseFloat(newMultiplier.toFixed(2)) } : dl
    );
    setDamageLevels(updated);
  };

  const handleSaveMultipliers = async () => {
    try {
      EStore.saveDamageLevels(damageLevels);
      toast.success("Faktor pengali tingkat kerusakan berhasil disimpan");
      
      // Log to audit log
      await dbService.addAuditLog(
        "admin-uid",
        "Budi Hartono",
        "admin",
        "Update Sistem",
        "Memperbarui faktor pengali tingkat kerusakan sampah elektronik."
      );
      loadData();
    } catch (e) {
      toast.error("Gagal menyimpan konfigurasi");
    }
  };

  // Backup Local Storage DB as JSON
  const handleBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      const keys = ["ew_locations", "ew_categories", "ew_damage_levels", "ew_vouchers", "ew_news", "ew_users", "ew_transactions", "ew_redeems", "ew_bookings", "ew_audit_logs"];
      
      keys.forEach((k) => {
        const item = localStorage.getItem(k);
        if (item) {
          backupData[k] = JSON.parse(item);
        }
      });

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `E-Waste_Database_Backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      toast.success("Backup database berhasil diunduh");
    } catch (e) {
      toast.error("Gagal melakukan backup database");
    }
  };

  // Restore Local Storage DB from JSON
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        Object.keys(json).forEach((key) => {
          localStorage.setItem(key, JSON.stringify(json[key]));
        });
        toast.success("Database berhasil dipulihkan (Restore)");
        loadData();
        
        // Log to audit log
        await dbService.addAuditLog(
          "admin-uid",
          "Budi Hartono",
          "admin",
          "Restore Database",
          "Melakukan pemulihan database dari file cadangan JSON."
        );
      } catch (err) {
        toast.error("Format berkas backup tidak valid!");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAuditLogs = () => {
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh log audit? Tindakan ini tidak dapat dibatalkan!")) return;
    try {
      EStore.saveAuditLogs([]);
      toast.success("Log audit berhasil dibersihkan");
      loadData();
    } catch (e) {
      toast.error("Gagal membersihkan log audit");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Pengaturan Sistem & Keamanan</h1>
        <p className="text-sm text-slate-500 font-medium text-slate-500">Kelola bobot kerusakan barang, pencadangan database, dan pemantauan jejak audit log.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Multiplier configuration */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Settings className="h-5 w-5 text-dlh-green-600" /> Bobot Faktor Kerusakan
              </h3>
              <p className="text-xs text-slate-500">Pengali nilai dasar poin berdasarkan tingkat kondisi fisik</p>
            </div>
            <button
              onClick={handleSaveMultipliers}
              className="inline-flex items-center gap-1.5 rounded-xl bg-dlh-green-600 hover:bg-dlh-green-700 text-white px-4 py-2 text-xs font-bold transition-all"
            >
              <Save className="h-4 w-4" /> Simpan Perubahan
            </button>
          </div>

          <div className="space-y-3">
            {damageLevels.map((dl) => (
              <div key={dl.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">{dl.name}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={dl.multiplier}
                    onChange={(e) => handleMultiplierChange(dl.id, parseFloat(e.target.value))}
                    className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-dlh-green-600"
                  />
                  <span className="w-16 text-right font-extrabold text-slate-800 text-sm">
                    {dl.multiplier} x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database backup card */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-dlh-blue-600" /> Backup & Pemulihan
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">Cadangkan atau pulihkan data lokal aplikasi Anda dengan berkas JSON.</p>
          
          <div className="space-y-4">
            <button
              onClick={handleBackup}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dlh-blue-200 bg-dlh-blue-50 text-dlh-blue-700 text-xs font-bold hover:bg-dlh-blue-100 transition-all"
            >
              <Download className="h-4.5 w-4.5" /> Unduh Cadangan (Backup)
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                id="restore-file-input"
                className="hidden"
              />
              <label
                htmlFor="restore-file-input"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <Upload className="h-4.5 w-4.5 text-slate-500" /> Pulihkan Data (Restore)
              </label>
            </div>
            
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 mt-4">
              <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                * Peringatan: Pemulihan data akan menimpa seluruh status data transaksi, saldo, dan pengguna saat ini.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Panel */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-600" /> Jejak Audit Sistem (Audit Log)
            </h3>
            <p className="text-xs text-slate-500 font-medium">Catatan aktivitas penting, login, dan modifikasi data transaksi oleh seluruh role.</p>
          </div>
          <button
            onClick={handleClearAuditLogs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 px-3 py-1.5 text-xs font-bold transition-all"
          >
            <Trash2 className="h-4 w-4" /> Bersihkan Log
          </button>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-3">Pengguna</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-3">Aksi</th>
                <th className="py-3 px-4">Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-semibold">Belum ada jejak aktivitas sistem.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{log.userName}</td>
                    <td className="py-3.5 px-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        log.userRole === "admin" 
                          ? "bg-dlh-blue-50 text-dlh-blue-700" 
                          : log.userRole === "petugas" 
                          ? "bg-dlh-green-50 text-dlh-green-700" 
                          : "bg-dlh-yellow-50 text-dlh-yellow-800"
                      }`}>
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-sm break-words">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
