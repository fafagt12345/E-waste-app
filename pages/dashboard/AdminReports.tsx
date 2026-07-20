import { useState, useEffect } from "react";
import { dbService, Transaction, EStore } from "../../services/db";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw,
  TrendingDown,
  Layers,
  Award
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toast, Toaster } from "sonner";

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Filter Fields
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterOfficer, setFilterOfficer] = useState("");
  const [filterUser, setFilterUser] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getTransactions();
      setTransactions(data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCategory("");
    setFilterBrand("");
    setFilterCondition("");
    setFilterOfficer("");
    setFilterUser("");
    toast.success("Filter disetel ulang");
  };

  // Filter Logic
  const filteredTxs = transactions.filter((tx) => {
    if (filterStartDate && new Date(tx.date) < new Date(filterStartDate)) return false;
    if (filterEndDate) {
      const nextDay = new Date(filterEndDate);
      nextDay.setDate(nextDay.getDate() + 1);
      if (new Date(tx.date) > nextDay) return false;
    }
    if (filterCategory && tx.category !== filterCategory) return false;
    if (filterBrand && tx.brand.toLowerCase() !== filterBrand.toLowerCase()) return false;
    if (filterCondition && tx.damageLevel !== filterCondition) return false;
    if (filterOfficer && !tx.officerName.toLowerCase().includes(filterOfficer.toLowerCase())) return false;
    if (filterUser && !tx.userName.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  // Export to Excel handler (Native CSV for zero-dependency runtime safety)
  const handleExportExcel = () => {
    try {
      if (filteredTxs.length === 0) {
        toast.warning("Tidak ada transaksi untuk diekspor");
        return;
      }

      const headers = [
        "ID Transaksi",
        "Tanggal",
        "Petugas DLH",
        "Nama Penyetor",
        "Kategori",
        "Jenis Barang",
        "Merek",
        "Berat (kg)",
        "Kondisi",
        "Faktor Multiplier",
        "Poin Diperoleh",
        "Emisi CO2 Berkurang (kg)",
        "Catatan Fisik"
      ];

      const csvRows = [headers.join(",")];

      filteredTxs.forEach((tx) => {
        const dateStr = new Date(tx.date).toLocaleDateString("id-ID", { 
          day: "2-digit", 
          month: "long", 
          year: "numeric", 
          hour: "2-digit", 
          minute: "2-digit" 
        });
        const row = [
          `"${tx.id}"`,
          `"${dateStr}"`,
          `"${tx.officerName.replace(/"/g, '""')}"`,
          `"${tx.userName.replace(/"/g, '""')}"`,
          `"${tx.category.replace(/"/g, '""')}"`,
          `"${tx.itemType.replace(/"/g, '""')}"`,
          `"${tx.brand.replace(/"/g, '""')}"`,
          tx.weight,
          `"${tx.damageLevel.replace(/"/g, '""')}"`,
          tx.damageMultiplier,
          tx.points,
          tx.carbonSaved,
          `"${(tx.notes || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      // Add BOM to ensure Excel opens comma-separated format in Indonesian localization settings
      const csvContent = "\ufeff" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_E-Waste_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel CSV berhasil diunduh");
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengekspor Excel");
    }
  };

  // Export to PDF table handler
  const handleExportPDF = () => {
    try {
      if (filteredTxs.length === 0) {
        toast.warning("Tidak ada transaksi untuk diekspor");
        return;
      }

      const doc = new jsPDF({ orientation: "landscape" });
      
      // Header Dinas
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(22, 163, 74); // DLH Green
      doc.text("DINAS LINGKUNGAN HIDUP (DLH)", 14, 18);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text("Laporan Aktivitas Penukaran Sampah Elektronik (E-Waste Smart Exchange)", 14, 24);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`, 14, 29);
      
      // Horizontal Rule
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 32, 280, 32);

      // Draw Table Headers manually or via autotable (simulated clean format for safety)
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      // Columns config
      const headers = ["ID", "TGL", "PENYETOR", "KATEGORI", "BARANG", "MEREK", "BERAT", "KONDISI", "POIN", "CO2 (kg)"];
      const colX = [14, 32, 54, 89, 135, 165, 188, 205, 237, 260];
      
      headers.forEach((h, i) => {
        doc.text(h, colX[i], 39);
      });

      doc.line(14, 42, 280, 42);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      
      let y = 47;
      filteredTxs.forEach((tx, idx) => {
        if (y > 185) {
          doc.addPage();
          // Redraw headers on new page
          doc.setFont("Helvetica", "bold");
          headers.forEach((h, i) => {
            doc.text(h, colX[i], 20);
          });
          doc.line(14, 23, 280, 23);
          doc.setFont("Helvetica", "normal");
          y = 28;
        }

        const dateFormatted = new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        const nameShort = tx.userName.substring(0, 16);
        const catShort = tx.category.split(" / ")[0];
        
        doc.text(tx.id, colX[0], y);
        doc.text(dateFormatted, colX[1], y);
        doc.text(nameShort, colX[2], y);
        doc.text(catShort, colX[3], y);
        doc.text(tx.itemType.substring(0, 15), colX[4], y);
        doc.text(tx.brand, colX[5], y);
        doc.text(`${tx.weight} kg`, colX[6], y);
        doc.text(tx.damageLevel.substring(0, 15), colX[7], y);
        doc.text(`+${tx.points} P`, colX[8], y);
        doc.text(`${tx.carbonSaved} kg`, colX[9], y);
        
        y += 7;
      });

      // Footer Summary Box
      y += 5;
      doc.setDrawColor(241, 245, 249);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 266, 20, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      
      const totalWeightSum = filteredTxs.reduce((s, tx) => s + tx.weight, 0).toFixed(2);
      const totalPointsSum = filteredTxs.reduce((s, tx) => s + tx.points, 0);
      const totalCarbonSum = filteredTxs.reduce((s, tx) => s + tx.carbonSaved, 0).toFixed(1);

      doc.text(`TOTAL TRANSAKSI: ${filteredTxs.length}`, 20, y + 12);
      doc.text(`TOTAL BERAT: ${totalWeightSum} kg`, 95, y + 12);
      doc.text(`TOTAL CARBON REDUCED: ${totalCarbonSum} kg CO2`, 160, y + 12);
      
      doc.save(`Laporan_E-Waste_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengekspor PDF");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Laporan & Rekapitulasi E-Waste</h1>
        <p className="text-sm text-slate-500">Filter data transaksi sampah elektronik dan ekspor menjadi dokumen Excel atau PDF resmi.</p>
      </div>

      {/* Filter Card */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-dlh-green-600" /> Filter Kustom
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Mulai Tanggal</label>
            <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-dlh-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Sampai Tanggal</label>
            <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-dlh-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori Barang</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-dlh-green-500">
              <option value="">Semua Kategori</option>
              {EStore.getCategories().map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Merek Barang</label>
            <input type="text" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} placeholder="Samsung, Asus, Xiaomi..." className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-dlh-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tingkat Kerusakan</label>
            <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-dlh-green-500">
              <option value="">Semua Kondisi</option>
              {EStore.getDamageLevels().map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Petugas</label>
            <input type="text" value={filterOfficer} onChange={(e) => setFilterOfficer(e.target.value)} placeholder="Cari nama petugas..." className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-dlh-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Penyetor (User)</label>
            <input type="text" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} placeholder="Cari nama penyetor..." className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-dlh-green-500" />
          </div>
          <div className="flex gap-2 items-end">
            <button
              onClick={handleResetFilters}
              className="w-1/2 h-10 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={loadData}
              className="w-1/2 h-10 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              Reload
            </button>
          </div>
        </div>
      </div>

      {/* Export & summary bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-slate-600 bg-slate-100/70 border px-4 py-2 rounded-2xl flex items-center gap-4">
          <span>Ditemukan: <strong className="text-slate-800">{filteredTxs.length} transaksi</strong></span>
          <span className="text-slate-300">|</span>
          <span>Berat: <strong className="text-slate-800">{filteredTxs.reduce((s, tx) => s + tx.weight, 0).toFixed(2)} kg</strong></span>
          <span className="text-slate-300">|</span>
          <span>Carbon: <strong className="text-dlh-green-700">{filteredTxs.reduce((s, tx) => s + tx.carbonSaved, 0).toFixed(1)} kg CO2</strong></span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2.5 text-xs font-extrabold hover:bg-emerald-100 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" /> Ekspor Excel (XLSX)
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-xs font-extrabold hover:bg-red-100 transition-all active:scale-95"
          >
            <FileText className="h-4 w-4" /> Ekspor PDF Resmi
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="font-semibold">Tidak ditemukan transaksi</p>
            <p className="text-xs">Ubah filter Anda untuk menemukan hasil lain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">ID</th>
                  <th className="py-3 px-2">Tanggal</th>
                  <th className="py-3 px-2">Petugas</th>
                  <th className="py-3 px-2">Penyetor</th>
                  <th className="py-3 px-2">Kategori</th>
                  <th className="py-3 px-2">Barang</th>
                  <th className="py-3 px-2">Merek</th>
                  <th className="py-3 px-2">Kerusakan</th>
                  <th className="py-3 px-2">Berat</th>
                  <th className="py-3 px-2">Poin</th>
                  <th className="py-3 px-4 rounded-r-2xl text-right">CO2 Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-600">{tx.id}</td>
                    <td className="py-4 px-2 text-slate-500">
                      {new Date(tx.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-4 px-2 font-medium text-slate-700">{tx.officerName.split(" ")[0]}</td>
                    <td className="py-4 px-2 font-semibold text-slate-800">{tx.userName}</td>
                    <td className="py-4 px-2 text-slate-500">{tx.category.split(" / ")[0]}</td>
                    <td className="py-4 px-2 font-semibold text-slate-800">{tx.itemType}</td>
                    <td className="py-4 px-2 font-semibold text-slate-600">{tx.brand}</td>
                    <td className="py-4 px-2">
                      <span className="text-[10px] font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {tx.damageLevel}
                      </span>
                    </td>
                    <td className="py-4 px-2 font-bold text-slate-700">{tx.weight} kg</td>
                    <td className="py-4 px-2">
                      <span className="inline-flex items-center gap-1 font-extrabold text-dlh-green-700 bg-dlh-green-50 px-2 py-0.5 rounded-full text-[10px]">
                        +{tx.points} P
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-dlh-green-600">
                      {tx.carbonSaved} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
