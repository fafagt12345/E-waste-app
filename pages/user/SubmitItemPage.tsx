import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService, EStore, WasteBankLocation, Booking } from "../../services/db";
import { aiService } from "../../services/aiService";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  UploadCloud, 
  Trash2, 
  Eye, 
  Edit3, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  Camera, 
  Image as ImageIcon,
  X,
  FileImage,
  ChevronRight,
  Recycle
} from "lucide-react";
import { toast, Toaster } from "sonner";

interface PhotoItem {
  id: string;
  url: string;
  label: string;
  progress: number; // 0-100
  status: "uploading" | "success" | "failed";
}

export function SubmitItemPage() {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<WasteBankLocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard Steps: "info" | "item" | "review"
  const [wizardStep, setWizardStep] = useState<"info" | "item">("info");

  // Booking Form Fields
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("08:00 - 10:00");
  
  // Item attributes
  const [itemName, setItemName] = useState("");
  const [brandName, setBrandName] = useState("Samsung");
  const [conditionName, setConditionName] = useState("Rusak Sedang");
  const [itemPreview, setItemPreview] = useState("");

  // Photo attachments (1-5 photos)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null); // For lightbox
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  // Camera simulator viewport modal
  const [cameraOpen, setCameraOpen] = useState(false);
  const [simulatedFlash, setSimulatedFlash] = useState(false);

  // Active details modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const locs = await dbService.getLocations();
      const books = await dbService.getBookings();
      setLocations(locs);
      setBookings(books.filter((b) => b.userId === profile?.uid || b.userId === "user-uid"));
      if (locs.length > 0) {
        setLocationId(locs[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Photo Picker
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > 5) {
      toast.warning("Maksimal 5 foto per barang.");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Limit check (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ukuran foto '${file.name}' terlalu besar. Maksimal 10 MB.`);
        continue;
      }

      const tempId = `photo-${Date.now()}-${i}`;
      const tempUrl = URL.createObjectURL(file);

      const newPhoto: PhotoItem = {
        id: tempId,
        url: tempUrl,
        label: photos.length === 0 ? "Tampak Depan" : "Tampak Belakang",
        progress: 10,
        status: "uploading"
      };

      setPhotos((prev) => [...prev, newPhoto]);
      simulateCloudinaryUpload(tempId, tempUrl, file);
    }
  };

  // Simulate Cloudinary upload progress
  const simulateCloudinaryUpload = (id: string, url: string, file: File | string) => {
    let currentProgress = 10;
    const interval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 25) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        setPhotos((prev) => 
          prev.map((p) => p.id === id ? { ...p, progress: 100, status: "success" } : p)
        );
        toast.success("Foto berhasil diunggah ke Cloudinary.");
        
        // Trigger AI auto-fill on the first uploaded photo
        if (photos.length === 0) {
          triggerAISuggestions(file);
        }
      } else {
        setPhotos((prev) => 
          prev.map((p) => p.id === id ? { ...p, progress: currentProgress } : p)
        );
      }
    }, 400);
  };

  // Simulated Camera trigger
  const handleCaptureCamera = () => {
    if (photos.length >= 5) {
      toast.warning("Maksimal 5 foto per barang.");
      return;
    }
    setCameraOpen(true);
  };

  const executeSimulatedCapture = () => {
    setSimulatedFlash(true);
    setTimeout(() => {
      setSimulatedFlash(false);
      setCameraOpen(false);
      
      // Select a random mock e-waste photo for camera simulation
      const mockCameraUrls = [
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500"
      ];
      const randomUrl = mockCameraUrls[Math.floor(Math.random() * mockCameraUrls.length)];
      const tempId = `photo-${Date.now()}`;
      
      const newPhoto: PhotoItem = {
        id: tempId,
        url: randomUrl,
        label: photos.length === 0 ? "Tampak Depan" : "Titik Kerusakan",
        progress: 10,
        status: "uploading"
      };

      setPhotos((prev) => [...prev, newPhoto]);
      simulateCloudinaryUpload(tempId, randomUrl, "camera_capture.jpg");
    }, 400);
  };

  // AI recommendations triggers
  const triggerAISuggestions = async (fileOrUrl: File | string) => {
    toast.info("AI sedang menganalisis foto untuk rekomendasi form...");
    try {
      const result = await aiService.analyzeImage(fileOrUrl);
      setItemName(result.itemType);
      setBrandName(result.brand);
      setConditionName(result.estimatedCondition);
      setAiConfidence(result.confidenceScore);
      setItemPreview(result.itemType);
      
      toast.success(`Rekomendasi AI terpasang (Confidence: ${result.confidenceScore}%)`);
    } catch (e) {
      console.warn("AI recommendation failed", e);
    }
  };

  const handleEditLabel = (id: string, newLabel: string) => {
    setPhotos((prev) => 
      prev.map((p) => p.id === id ? { ...p, label: newLabel } : p)
    );
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast.info("Foto dihapus.");
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!date) {
      toast.warning("Silakan pilih tanggal kedatangan");
      return;
    }
    if (!itemName) {
      toast.warning("Masukkan nama barang.");
      return;
    }
    if (photos.length === 0) {
      toast.warning("Unggah minimal 1 foto barang.");
      return;
    }

    const matchedLoc = locations.find(l => l.id === locationId);
    if (!matchedLoc) return;

    try {
      // Build final preview text
      const previewText = `${itemName} (${brandName}) - ${photos.length} Foto`;

      await dbService.createBooking({
        userId: profile.uid,
        userName: profile.fullName,
        locationId,
        locationName: matchedLoc.name,
        date,
        timeSlot,
        itemPreview: previewText,
        itemName,
        brand: brandName,
        condition: conditionName,
        userPhotos: photos.map(p => p.url),
        userPhotoLabels: photos.map(p => p.label),
        officerPhotos: []
      });

      toast.success("Jadwal penyetoran dengan dokumentasi foto berhasil dipesan!");
      
      // Reset form
      setDate("");
      setItemName("");
      setPhotos([]);
      setAiConfidence(null);
      setWizardStep("info");
      loadData();
    } catch (err) {
      toast.error("Gagal mengirim booking");
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Booking & Dokumentasi E-Waste</h1>
        <p className="text-sm text-slate-500 font-medium">Kirim booking penyetoran lengkap dengan upload foto untuk mempermudah verifikasi petugas.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* WIZARD FORM PANEL */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm md:col-span-1 h-fit space-y-6">
          
          {/* Wizard Header Progress */}
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-5 w-5 text-dlh-green-600" /> Booking
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Sesi {wizardStep === "info" ? "1/2" : "2/2"}
            </span>
          </div>

          <form onSubmit={handleBookingSubmit} className="space-y-5">
            {/* STEP 1: INFO LOKASI & WAKTU */}
            {wizardStep === "info" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Unit Bank Sampah</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:border-dlh-green-500 outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Kedatangan</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none font-semibold text-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Sesi Jam (Time Slot)</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:border-dlh-green-500 outline-none"
                  >
                    <option value="08:00 - 10:00">08:00 - 10:00 (Pagi)</option>
                    <option value="10:00 - 12:00">10:00 - 12:00 (Siang)</option>
                    <option value="13:00 - 15:00">13:00 - 15:00 (Sore)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!date) {
                      toast.warning("Silakan pilih tanggal terlebih dahulu.");
                      return;
                    }
                    setWizardStep("item");
                  }}
                  className="w-full h-11 bg-dlh-green-600 hover:bg-dlh-green-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  Lanjut ke Detail Barang <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* STEP 2: DETAIL BARANG & FOTO */}
            {wizardStep === "item" && (
              <div className="space-y-4">
                
                {/* AI Confidence score if calculated */}
                {aiConfidence && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-dlh-green-600 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                      AI Vision menyarankan: <strong>{itemName} ({brandName})</strong> dengan tingkat kepercayaan <strong>{aiConfidence}%</strong>.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nama Barang Elektronik</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Misal: Laptop Asus, Kulkas Sharp..."
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Merek</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Samsung, Oppo, Asus..."
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kondisi Fisik</label>
                    <select
                      value={conditionName}
                      onChange={(e) => setConditionName(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:border-dlh-green-500 outline-none"
                    >
                      <option value="Masih Berfungsi">Masih Berfungsi</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Sedang">Rusak Sedang</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                      <option value="Mati Total">Mati Total</option>
                    </select>
                  </div>
                </div>

                {/* Photo uploader box */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-500">Upload Foto Barang</label>
                    <span className="font-bold text-slate-400">{photos.length}/5 Foto</span>
                  </div>

                  {/* Guide text */}
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed border p-2 bg-slate-50 rounded-xl">
                    ⚠️ <em>Panduan: Ambil foto dengan pencahayaan cukup. Pastikan barang terlihat jelas beserta logonya jika ada.</em>
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-dlh-green-500 hover:bg-dlh-green-50/10 transition-all text-center">
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Buka Galeri</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                        className="sr-only"
                        disabled={photos.length >= 5}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleCaptureCamera}
                      className="flex h-20 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-dlh-green-500 hover:bg-dlh-green-50/10 transition-all text-center"
                    >
                      <Camera className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Ambil Foto</span>
                    </button>
                  </div>
                </div>

                {/* Upload List & Progress indicator */}
                {photos.length > 0 && (
                  <div className="space-y-2 max-h-44 overflow-y-auto border-t pt-3">
                    {photos.map((p) => (
                      <div key={p.id} className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <img src={p.url} className="h-10 w-10 rounded-lg object-cover" alt="" />
                        <div className="flex-1 truncate">
                          {p.status === "uploading" ? (
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold text-slate-400">⏳ Mengunggah... ({p.progress}%)</span>
                              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-dlh-green-500 transition-all" style={{ width: `${p.progress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold text-emerald-600">✅ Berhasil</span>
                              <select
                                value={p.label}
                                onChange={(e) => handleEditLabel(p.id, e.target.value)}
                                className="text-[9px] font-semibold border rounded px-1 text-slate-600 bg-white"
                              >
                                <option value="Tampak Depan">Tampak Depan</option>
                                <option value="Tampak Belakang">Tampak Belakang</option>
                                <option value="Layar Utama">Layar Utama</option>
                                <option value="Detail Merek">Detail Merek</option>
                                <option value="Titik Kerusakan">Titik Kerusakan</option>
                              </select>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(p.id)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep("info")}
                    className="w-1/3 h-11 border rounded-2xl text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-0.5"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 h-11 bg-dlh-green-600 hover:bg-dlh-green-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1 transition-all shadow-md active:scale-95"
                  >
                    Kirim Booking Setoran
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* BOOKINGS LIST PANEL */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm md:col-span-2 space-y-4">
          <h3 className="font-extrabold text-slate-800">Jadwal Booking Anda</h3>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              Belum ada jadwal penyetoran yang dipesan. Silakan buat di form sebelah kiri.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div 
                  key={b.id} 
                  onClick={() => setSelectedBooking(b)}
                  className="p-4 border rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        b.status === "completed" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-dlh-blue-50 text-dlh-blue-700 border-dlh-blue-100"
                      }`}>
                        {b.status === "scheduled" ? "Terjadwal" : "Selesai"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {b.id}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800">{b.locationName}</h4>
                    
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-4">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {b.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {b.timeSlot}</span>
                    </p>
                    
                    {b.itemName && (
                      <p className="text-[11px] text-slate-600 font-semibold mt-1 flex items-center gap-1">
                        <FileImage className="h-3.5 w-3.5 text-slate-400" />
                        Barang: <strong>{b.itemName} ({b.brand})</strong> - {b.userPhotos?.length || 0} Foto
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-dlh-green-600 bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-2xs self-start sm:self-center">
                    Detail <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOOKING DETAILS DIALOG WITH GALLERY LIGHTBOX */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Booking Penyetoran</span>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-slate-400 font-semibold">Unit Penerimaan:</span>
                  <span className="text-slate-800 font-bold">{selectedBooking.locationName}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">Status:</span>
                  <span className="text-slate-800 font-bold capitalize">{selectedBooking.status}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">Tanggal Kedatangan:</span>
                  <span className="text-slate-800 font-bold">{selectedBooking.date}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">Sesi Jam:</span>
                  <span className="text-slate-800 font-bold">{selectedBooking.timeSlot}</span>
                </div>
              </div>

              <hr />

              {selectedBooking.itemName && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-sm">Informasi Barang Elektronik</h4>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border rounded-2xl text-center">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-semibold uppercase">Nama Barang</span>
                      <strong className="text-slate-700">{selectedBooking.itemName}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-semibold uppercase">Merek</span>
                      <strong className="text-slate-700">{selectedBooking.brand}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-semibold uppercase">Kondisi Awal</span>
                      <strong className="text-slate-700">{selectedBooking.condition}</strong>
                    </div>
                  </div>

                  {/* USER GALLERY */}
                  <h5 className="font-bold text-slate-500 text-xs mt-3">Galeri Foto Sebelum Penyetoran ({selectedBooking.userPhotos?.length || 0})</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedBooking.userPhotos?.map((p, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border bg-slate-100 aspect-square">
                        <img src={p} className="h-full w-full object-cover" alt="" />
                        {selectedBooking.userPhotoLabels?.[idx] && (
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            {selectedBooking.userPhotoLabels[idx]}
                          </span>
                        )}
                        <button
                          onClick={() => setActivePhotoIndex(idx)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OFFICER RECEIVE GALLERY */}
              {selectedBooking.status === "completed" && (
                <div className="space-y-2 border-t pt-3">
                  <h5 className="font-bold text-slate-700 text-xs">Dokumentasi Petugas (Saat Penerimaan)</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedBooking.officerPhotos?.map((p, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border bg-slate-100 aspect-square">
                        <img src={p} className="h-full w-full object-cover" alt="" />
                        <button
                          onClick={() => setActivePhotoIndex((selectedBooking.userPhotos?.length || 0) + idx)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-dlh-green-50 border border-dlh-green-100 rounded-2xl flex justify-between text-xs text-dlh-green-800">
                    <span>Timbangan Bersih: <strong>{selectedBooking.weightReceived} kg</strong></span>
                    <span>Poin Diterima: <strong>+{selectedBooking.pointsAwarded} P</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setSelectedBooking(null)} className="h-10 px-6 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-all">Tutup Detail</button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX PREVIEW */}
      {activePhotoIndex !== null && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button 
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Lightbox Image */}
          <div className="max-w-4xl max-h-[80vh]">
            <img 
              src={
                activePhotoIndex < (selectedBooking.userPhotos?.length || 0)
                  ? selectedBooking.userPhotos?.[activePhotoIndex]
                  : selectedBooking.officerPhotos?.[activePhotoIndex - (selectedBooking.userPhotos?.length || 0)]
              } 
              className="max-w-full max-h-[85vh] rounded-xl object-contain" 
              alt="" 
            />
            <p className="text-center text-white text-sm mt-3 font-semibold">
              {activePhotoIndex < (selectedBooking.userPhotos?.length || 0)
                ? `Foto Sebelum Penyetoran: ${selectedBooking.userPhotoLabels?.[activePhotoIndex] || "N/A"}`
                : "Foto Saat Penerimaan Petugas"}
            </p>
          </div>
        </div>
      )}

      {/* SIMULATED CAMERA VIEWPORT MODAL */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
            
            {/* Viewport header */}
            <div className="p-4 border-b border-slate-800 text-white flex justify-between items-center text-xs">
              <span className="font-extrabold flex items-center gap-1.5"><Camera className="h-4.5 w-4.5 text-dlh-green-500 animate-pulse" /> KAMERA AKTIF</span>
              <button onClick={() => setCameraOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* Viewport screen */}
            <div className="relative aspect-video bg-black flex items-center justify-center text-white">
              {simulatedFlash && (
                <div className="absolute inset-0 bg-white z-30 transition-opacity" />
              )}
              
              {/* Simulated camera grid overlay */}
              <div className="absolute inset-4 border border-white/20 grid grid-cols-3 grid-rows-3 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 border border-dlh-yellow-400/80 rounded-full" />
              
              {/* Live camera stream placeholder */}
              <div className="text-center space-y-2 z-10 p-4">
                <Recycle className="h-8 w-8 text-dlh-green-500 mx-auto animate-spin-slow" />
                <span className="block text-xs font-bold text-slate-300">Mengarahkan Kamera ke Sampah Elektronik</span>
                <span className="block text-[9px] text-slate-500">Posisikan logo merek berada di tengah lingkaran kuning</span>
              </div>
            </div>

            {/* Viewport footer triggers */}
            <div className="p-5 bg-slate-950 flex justify-center items-center">
              <button
                onClick={executeSimulatedCapture}
                className="h-14 w-14 rounded-full border-4 border-white bg-red-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <div className="h-10 w-10 rounded-full bg-red-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}