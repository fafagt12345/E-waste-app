import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService, EStore, Booking, Transaction, WasteBankLocation, EItemCategory } from "../../services/db";
import { uploadToCloudinary } from "../../services/uploadService";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Search,
  FileImage,
  Camera,
  UploadCloud,
  Trash2,
  Eye,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Send,
  Printer,
  X,
  Scale,
  Award
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config";
import { toast, Toaster } from "sonner";

interface PhotoItem {
  id: string;
  url: string;
  label: string;
  progress: number;
  status: "uploading" | "success" | "failed";
}

export function BookingCheckinPage() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Checkin process states
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [officerPhotos, setOfficerPhotos] = useState<PhotoItem[]>([]);

  // Adjusted Fields by Officer
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("Rusak Sedang");
  const [weightKg, setWeightKg] = useState<number>(1.0);
  const [manualPoints, setManualPoints] = useState<number | null>(null);

  // Camera simulator
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Lightbox preview
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Complete Receipt
  const [receiptBooking, setReceiptBooking] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getBookings();
      // Show scheduled bookings
      const scheduled = data.filter((b) => b.status === "scheduled");

      // Filter by officer location branch if assigned
      if (profile?.role === "petugas" && profile.locationId) {
        setBookings(scheduled.filter((b) => b.locationId === profile.locationId));
      } else {
        setBookings(scheduled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const handleStartCheckin = async (booking: Booking) => {
    setActiveBooking(booking);
    setItemName(booking.itemName || "");
    setBrand(booking.brand || "");
    setCondition(booking.condition || "Rusak Sedang");
    setWeightKg(1.0);
    setManualPoints(null);
    setOfficerPhotos([]);

    // Cek kesiapan user
    const userRef = doc(db, "users", booking.userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists() || !userDoc.data().memberId) {
      toast.warning("Akun penyetor ini belum siap. Minta pengguna untuk me-refresh halaman profil mereka hingga Member ID muncul.");
      setActiveBooking(null); // Batalkan proses jika user belum siap
      return;
    }
    toast.success(`Check-in dimulai untuk: ${booking.userName}`);
  };

  // Photo uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (officerPhotos.length + files.length > 5) {
      toast.warning("Maksimal 5 foto penerimaan.");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Foto '${file.name}' melebihi 10MB.`);
        continue;
      }

      const tempId = `off-photo-${Date.now()}-${i}`;
      const tempUrl = URL.createObjectURL(file);

      const newPhoto: PhotoItem = {
        id: tempId,
        url: tempUrl,
        label: officerPhotos.length === 0 ? "Foto Penerimaan" : "Kondisi Detil",
        progress: 10,
        status: "uploading"
      };

      setOfficerPhotos((prev) => [...prev, newPhoto]);
      processCloudinaryUpload(tempId, file);
    }
  };

  const processCloudinaryUpload = async (id: string, file: File | Blob) => {
    try {
      const secureUrl = await uploadToCloudinary(file, (progress) => {
        setOfficerPhotos((prev) =>
          prev.map((p) => p.id === id ? { ...p, progress } : p)
        );
      });
      setOfficerPhotos((prev) =>
        prev.map((p) => p.id === id ? { ...p, url: secureUrl, progress: 100, status: "success" } : p)
      );
      toast.success("Foto penerimaan diupload ke Cloudinary.");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah foto penerimaan.");
      setOfficerPhotos((prev) =>
        prev.map((p) => p.id === id ? { ...p, status: "failed" } : p)
      );
    }
  };

  const handleOpenCamera = async () => {
    if (officerPhotos.length >= 5) {
      toast.warning("Maksimal 5 foto.");
      return;
    }
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Tidak dapat mengakses kamera. Pastikan Anda memberikan izin.");
      setCameraOpen(false);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const tempId = `off-photo-${Date.now()}`;
          const tempUrl = URL.createObjectURL(blob);
          const newPhoto: PhotoItem = {
            id: tempId,
            url: tempUrl,
            label: "Foto Penerimaan",
            progress: 10,
            status: "uploading"
          };
          setOfficerPhotos((prev) => [...prev, newPhoto]);
          processCloudinaryUpload(tempId, blob); // Real upload for the captured photo
        }
      }, "image/jpeg");

      handleCloseCamera();
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraOpen(false);
  };

  // Math point calculations
  const categories = EStore.getCategories();
  const matchedCat = categories.find(c => itemName.toLowerCase().includes(c.name.split(" / ")[0].toLowerCase())) || categories.find(c => c.name.includes(itemName)) || categories[0];
  const basePrice = matchedCat ? matchedCat.basePrice : 100;

  const damageLevels = EStore.getDamageLevels();
  const matchedDmg = damageLevels.find(d => d.name === condition) || damageLevels[2]; // Default ke Rusak Sedang
  const multiplier = matchedDmg ? matchedDmg.multiplier : 1.0;

  const pointsAwarded = manualPoints ?? Math.round(basePrice * weightKg * multiplier);

  // Carbon Emission saved (simulated multiplier based on category)
  let carbonFactor = 1.5;
  if (matchedCat.name.includes("Komputer")) carbonFactor = 8.0;
  else if (matchedCat.name.includes("Gadget")) carbonFactor = 4.8;
  const carbonSaved = parseFloat((weightKg * carbonFactor).toFixed(1));

  // Submit check-in complete
  const handleSubmitCheckin = async () => {
    if (!activeBooking) return;
    if (officerPhotos.length === 0) {
      toast.warning("Unggah minimal 1 foto kondisi barang saat penerimaan!");
      return;
    }

    try {
      const updated = await dbService.completeBookingCheckin(
        activeBooking.id,
        officerPhotos.map(p => p.url),
        weightKg,
        pointsAwarded,
        carbonSaved,
        profile?.uid || "officer-uid",
        profile?.fullName || "Agus Saputra (Petugas DLH)"
      );

      if (updated) {
        setReceiptBooking({
          ...updated,
          carbonSaved,
          pointsAwarded
        });
        toast.success("Check-in Booking Sukses! Poin ditransfer.");
        setActiveBooking(null);
        loadData();
      } else {
        toast.error("Gagal memproses check-in.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem check-in.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredBookings = bookings.filter(b =>
    b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <Toaster position="top-right" richColors />

      {/* Title */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Pelayanan Booking Penyetoran</h1>
          <p className="text-sm text-slate-500 font-medium">Lakukan verifikasi, upload foto timbangan, dan check-in kedatangan sampah elektronik.</p>
        </div>

        {activeBooking && (
          <button
            onClick={() => setActiveBooking(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
        )}
      </div>

      {/* RECEIPT SUCCESS VIEW */}
      {receiptBooking && (
        <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm text-center max-w-md mx-auto space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-md">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-800 font-sans">Check-In Berhasil</h2>
            <p className="text-xs text-slate-500 font-semibold">Timbangan dan poin terverifikasi telah masuk di log audit resmi.</p>
          </div>

          {/* Receipt detail printable area */}
          <div id="print-receipt" className="border-2 border-slate-200 border-dashed rounded-2xl p-6 bg-slate-50 text-left space-y-4 text-xs">
            <div className="text-center border-b pb-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">BUKTI CHECK-IN BOOKING</span>
              <h4 className="text-sm font-extrabold text-slate-800">E-Waste Smart Exchange</h4>
              <span className="text-[9px] font-semibold text-slate-500">DINAS LINGKUNGAN HIDUP (DLH)</span>
            </div>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between"><span>ID Booking:</span><strong className="text-slate-800 font-mono">{receiptBooking.id}</strong></div>
              <div className="flex justify-between"><span>Tanggal Setor:</span><span className="text-slate-800">{receiptBooking.date} ({receiptBooking.timeSlot})</span></div>
              <div className="flex justify-between"><span>Nama Penyetor:</span><span className="text-slate-800 font-bold">{receiptBooking.userName}</span></div>
              <hr className="border-dashed" />
              <div className="flex justify-between"><span>Barang / Kondisi:</span><span className="text-slate-800 font-semibold">{receiptBooking.itemName} ({receiptBooking.condition})</span></div>
              <div className="flex justify-between"><span>Berat Penerimaan:</span><strong className="text-slate-800">{receiptBooking.weightReceived} kg</strong></div>
              <div className="flex justify-between items-center bg-dlh-green-50 p-2.5 rounded-xl border border-dlh-green-100 text-xs">
                <span className="font-bold text-dlh-green-800">Poin Ditransfer:</span>
                <strong className="text-sm font-extrabold text-dlh-green-700">+{receiptBooking.pointsAwarded} P</strong>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 text-xs">
            <button onClick={handlePrint} className="w-1/2 h-11 border rounded-2xl hover:bg-slate-50 flex items-center justify-center gap-1 font-bold">
              <Printer className="h-4.5 w-4.5" /> Cetak Tiket
            </button>
            <button onClick={() => setReceiptBooking(null)} className="w-1/2 h-11 bg-dlh-green-600 hover:bg-dlh-green-700 text-white rounded-2xl flex items-center justify-center gap-1 font-extrabold shadow-md">
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* MAIN CHECKIN SCREEN */}
      {!receiptBooking && (
        <>
          {activeBooking === null ? (
            <div className="space-y-6">
              {/* Search Booking Bar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari ID Booking atau Nama Penyetor..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 focus:border-dlh-green-500 outline-none"
                />
              </div>

              {/* Bookings Queue Grid */}
              <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm overflow-hidden">
                <h3 className="font-extrabold text-slate-800 text-sm mb-4">
                  Antrean Penyetoran Hari Ini {profile?.locationName ? `- ${profile.locationName}` : ""}
                </h3>

                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-10 bg-slate-100 rounded-xl" />
                    <div className="h-10 bg-slate-100 rounded-xl" />
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">Tidak ada booking terjadwal aktif saat ini.</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredBookings.map((b) => (
                      <div key={b.id} className="border rounded-3xl p-5 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col justify-between h-48 hover:shadow-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-dlh-blue-600 bg-dlh-blue-50 px-2 py-0.5 rounded-full">{b.timeSlot}</span>
                            <span className="font-mono text-slate-400">{b.id}</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-800 truncate pt-1">{b.userName}</h4>
                          <span className="block text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {b.locationName.split(" ")[2]}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-bold truncate">Barang: {b.itemName} ({b.brand})</span>
                        </div>

                        <button
                          onClick={() => handleStartCheckin(b)}
                          className="w-full h-9 bg-dlh-green-600 hover:bg-dlh-green-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          Layani Penyetoran <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* WIZARD SERVICE check-in */
            <div className="grid gap-6 md:grid-cols-2">

              {/* LEFT COLUMN: BEFORE PIC (USER SUBMITTED) */}
              <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-dlh-blue-600 animate-pulse" /> Foto Sebelum Penyetoran (User)
                </h3>

                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1">
                    <div>Penyetor: <strong className="text-slate-800">{activeBooking.userName}</strong></div>
                    <div>Item Booking: <strong>{activeBooking.itemName} ({activeBooking.brand})</strong></div>
                    <div>Prediksi Kondisi: <strong>{activeBooking.condition}</strong></div>
                  </div>

                  {/* User Photos gallery grid */}
                  {activeBooking.userPhotos && activeBooking.userPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5">
                      {activeBooking.userPhotos.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border bg-slate-100 aspect-square">
                          <img src={url} className="h-full w-full object-cover" alt="" />
                          {activeBooking.userPhotoLabels?.[idx] && (
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                              {activeBooking.userPhotoLabels[idx]}
                            </span>
                          )}
                          <button
                            onClick={() => setLightboxIndex(idx)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">User tidak menyertakan foto awal.</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: AFTER PIC & CHECKIN VERIFICATION FORM */}
              <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-dlh-green-600 animate-pulse" /> Foto Saat Penerimaan (Petugas)
                </h3>

                <div className="space-y-4">
                  {/* Photo picker & camera */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex h-16 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-dlh-green-500 hover:bg-dlh-green-50/10 transition-all text-center">
                      <UploadCloud className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Pilih dari Galeri</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="sr-only"
                        disabled={officerPhotos.length >= 5}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleOpenCamera}
                      className="flex h-16 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-dlh-green-500 hover:bg-dlh-green-50/10 transition-all text-center"
                    >
                      <Camera className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Ambil Foto Timbangan</span>
                    </button>
                  </div>

                  {/* Officer Photos Gallery */}
                  {officerPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 border-t pt-3">
                      {officerPhotos.map((p, idx) => (
                        <div key={p.id} className="relative group rounded-xl overflow-hidden border bg-slate-100 aspect-square">
                          <img src={p.url} className="h-full w-full object-cover" alt="" />
                          <button
                            type="button"
                            onClick={() => setOfficerPhotos(prev => prev.filter(item => item.id !== p.id))}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-lg p-0.5 shadow-md"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Checkin form validation */}
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Barang Elektronik</label>
                        <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full h-9 border rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Merek</label>
                        <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full h-9 border rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kondisi Penerimaan</label>
                        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-9 border rounded-xl px-3 text-xs bg-white focus:border-dlh-green-500 outline-none">
                          <option value="Masih Berfungsi">Masih Berfungsi</option>
                          <option value="Rusak Ringan">Rusak Ringan</option>
                          <option value="Rusak Sedang">Rusak Sedang</option>
                          <option value="Rusak Berat">Rusak Berat</option>
                          <option value="Mati Total">Mati Total</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Timbangan Aktual (kg)</label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={weightKg}
                            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                            className="w-full h-9 border rounded-xl pl-9 pr-3 text-xs focus:border-dlh-green-500 outline-none font-bold"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Manual Point Override */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Override Poin (Opsional)</label>
                      <input
                        type="number"
                        value={manualPoints ?? ""}
                        onChange={(e) => setManualPoints(e.target.value === "" ? null : parseInt(e.target.value))}
                        placeholder="Masukkan poin jika perlu"
                        className="w-full h-9 border border-amber-300 bg-amber-50 rounded-xl px-3 text-xs focus:border-amber-500 outline-none font-bold"
                      />
                    </div>

                    {/* Point conversion preview */}
                    <div className="rounded-2xl bg-dlh-green-50 border border-dlh-green-100 p-3.5 space-y-1.5 text-xs text-dlh-green-800">
                      <div className="flex justify-between"><span>Harga Kategori ({matchedCat.name.split(" / ")[0]}):</span><span className="font-bold">{basePrice} P/kg</span></div>
                      <div className="flex justify-between"><span>Multiplier Kondisi ({condition}):</span><span className="font-bold">{multiplier}x</span></div>
                      <hr className="border-dlh-green-200/50" />
                      <div className="flex justify-between items-center text-sm font-extrabold">
                        <span>Poin Ditransfer:</span>
                        <span className="text-emerald-700 font-extrabold bg-white border px-3 py-0.5 rounded-full">+{pointsAwarded} Poin</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitCheckin}
                      className="w-full h-11 bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 text-white font-bold rounded-2xl text-xs hover:from-dlh-green-700 hover:to-dlh-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Send className="h-4.5 w-4.5" /> Konfirmasi Check-in & Kirim Poin
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* LIGHTBOX POPUP FOR BEFORE IMAGES */}
      {lightboxIndex !== null && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full">
            <X className="h-6 w-6" />
          </button>
          <div className="max-w-4xl max-h-[80vh]">
            <img src={activeBooking.userPhotos?.[lightboxIndex]} className="max-w-full max-h-[85vh] rounded-xl object-contain" alt="" />
            <p className="text-center text-white text-xs mt-3 font-semibold">
              Foto Sebelum Penyetoran: {activeBooking.userPhotoLabels?.[lightboxIndex] || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* CAMERA SIMULATOR VIEWER MODAL */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <div className="p-4 border-b border-slate-800 text-white flex justify-between items-center text-xs font-bold">
              <span>📷 VIEWPORT TIMBANGAN PETUGAS</span>
              <button onClick={handleCloseCamera} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center text-white">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-4 bg-slate-950 flex justify-center">
              <button onClick={handleTakePhoto} className="h-14 w-14 rounded-full border-4 border-white bg-red-600" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
