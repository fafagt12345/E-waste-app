import { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Package, Tag, FileText, Loader2 } from "lucide-react";

export function RequestPickupPage() {
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const { imageUrl, detectedItemName, detectedCategory } = location.state || {};

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        // Simulasi pengiriman data
        setTimeout(() => {
            setLoading(false);
            alert("Permintaan penjemputan berhasil diajukan!");
        }, 2000);
    };

    // Jika pengguna mencoba mengakses halaman ini secara langsung tanpa melalui halaman upload foto,
    // arahkan mereka kembali ke langkah awal.
    if (!imageUrl) {
        return <Navigate to="/user/submit-item" replace />;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Langkah 2: Detail Penjemputan</h1>
                <p className="mt-2 text-slate-600">Lengkapi detail barang dan jadwal agar petugas kami dapat menjemputnya.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
                    {/* Kolom Detail Barang */}
                    <div className="space-y-6 md:col-span-2">
                        <h2 className="text-lg font-semibold text-slate-800 border-b pb-3">Detail Barang</h2>
                        <div>
                            <label htmlFor="itemName" className="block text-sm font-medium text-slate-700">Nama Barang</label>
                            <div className="relative mt-2">
                                <Package className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input type="text" id="itemName" defaultValue={detectedItemName || ""} className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4" placeholder="Contoh: TV LED 32 inch" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-700">Kategori</label>
                            <div className="relative mt-2">
                                <Tag className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <select id="category" defaultValue={detectedCategory || ""} className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4" required>
                                    <option>Pilih Kategori...</option>
                                    <option>Televisi</option>
                                    <option>Laptop & Komputer</option>
                                    <option>Handphone & Tablet</option>
                                    <option>Peralatan Dapur</option>
                                    <option>Lainnya</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Catatan Kondisi</label>
                            <div className="relative mt-2">
                                <FileText className="pointer-events-none absolute left-4 top-4 text-slate-400" size={20} />
                                <textarea id="notes" rows={4} className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 py-3" placeholder="Contoh: Layar retak, tidak bisa menyala"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Kolom Foto Barang */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-800 border-b pb-3">Foto Barang</h2>
                        <img src={imageUrl} alt="Barang yang akan dijemput" className="w-full rounded-lg shadow-md" />
                    </div>

                    {/* Kolom Jadwal & Alamat */}
                    <div className="space-y-6 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t pt-6">
                        <h2 className="text-lg font-semibold text-slate-800 border-b pb-3">Jadwal & Lokasi</h2>
                        <div>
                            <label htmlFor="pickupDate" className="block text-sm font-medium text-slate-700">Tanggal Penjemputan</label>
                            <div className="relative mt-2">
                                <Calendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input type="date" id="pickupDate" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="pickupTime" className="block text-sm font-medium text-slate-700">Jam Penjemputan</label>
                            <div className="relative mt-2">
                                <Clock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input type="time" id="pickupTime" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-slate-700">Alamat Penjemputan</label>
                            <div className="relative mt-2">
                                <MapPin className="pointer-events-none absolute left-4 top-4 text-slate-400" size={20} />
                                <textarea id="address" rows={4} className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 py-3" defaultValue="Jl. Pahlawan No. 123, Kel. Magetan, Kec. Magetan, Kabupaten Magetan, Jawa Timur 63311"></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                        <button type="submit" disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin" /> : "Kirim Permintaan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}