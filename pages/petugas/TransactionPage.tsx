import { useState, ChangeEvent, useEffect } from "react";
import {
  QrCode,
  UploadCloud,
  Send,
  CheckCircle2,
  User,
  Weight,
  Recycle,
  Loader2,
  Sparkles,
  TrendingUp,
  Info,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Printer,
  ChevronRight,
  HardHat,
  Barcode
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config";
import { EStore, UserProfile, EItemCategory, dbService } from "../../services/db";
import { aiService } from "../../services/aiService";
import { uploadToCloudinary } from "../../services/uploadService";
import { toast, Toaster } from "sonner";

// Preset images for easy demo selection
const PRESET_DEMO_IMAGES = [
  { name: "Asus Laptop", url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60", file_name: "laptop_asus.jpg" },
  { name: "Samsung Galaxy", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60", file_name: "samsung_phone.jpg" },
  { name: "Keyboard", url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60", file_name: "keyboard_logitech.jpg" },
  { name: "Kipas Cosmos", url: "https://images.unsplash.com/photo-1618945032843-224159d5e82b?w=500&auto=format&fit=crop&q=60", file_name: "kipas_cosmos.jpg" }
];

export function TransactionPage() {
  const [step, setStep] = useState<"scan" | "photo" | "analyzing" | "verify" | "receipt">("scan");

  // Step 1: Scan States
  const [scannedUser, setScannedUser] = useState<UserProfile | null>(null);
  const [manualUid, setManualUid] = useState("");
  const [isUserReady, setIsUserReady] = useState(false); // State baru untuk cek kesiapan user

  // Step 2: Photo States
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [cloudinaryUploading, setCloudinaryUploading] = useState(false);

  // Step 3 & 4: AI & Verification States
  const [aiResult, setAiResult] = useState<AIVisionResult | null>(null);

  // Officer Adjusted Fields
  const [itemType, setItemType] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [damageLevelName, setDamageLevelName] = useState("");
  const [weightKg, setWeightKg] = useState<number>(1.0);
  const [manualPoints, setManualPoints] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Scanner barcode simulator
  const [serialCode, setSerialCode] = useState("");
  const [scanningSerial, setScanningSerial] = useState(false);

  // Final receipt data
  const [finalTransaction, setFinalTransaction] = useState<any | null>(null);

  // QR scan triggers
  const handleScanUser = async (user: UserProfile) => {
    setScannedUser(user);
    setIsUserReady(false); // Reset status kesiapan

    // Cek langsung ke Firestore untuk data terbaru, terutama memberId
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data().memberId) {
      setIsUserReady(true);
      toast.success(`User siap: ${user.fullName}`);
      setStep("photo");
    } else {
      setIsUserReady(false);
      toast.warning("Akun pengguna ini sedang difinalisasi. Member ID belum siap.");
    }
  };

  const handleManualLookup = async () => {
    const users = await dbService.getUsers(); // Ambil data terbaru
    const found = users.find(u => u.uid === manualUid || u.email === manualUid);
    if (found) {
      await handleScanUser(found);
    } else {
      toast.error("User tidak ditemukan. Gunakan quick-select.");
    }
  };

  // Cloudinary / Photo Upload
  const handleImageSelected = async (fileOrUrl: File | string) => {
    setCloudinaryUploading(true);
    setUploadedImageUrl("");

    let finalUrl = "";
    try {
      if (typeof fileOrUrl === "string") {
        // Mock camera capture
        await new Promise((resolve) => setTimeout(resolve, 1500));
        finalUrl = fileOrUrl;
      } else {
        // Real Cloudinary upload
        finalUrl = await uploadToCloudinary(fileOrUrl);
      }

      setUploadedImageUrl(finalUrl);
      toast.success("Foto berhasil diupload ke Cloudinary");
    } catch (e: any) {
      toast.error(e.message || "Gagal upload foto");
      setCloudinaryUploading(false);
      return;
    }
    
    setCloudinaryUploading(false);

    // Proceed to AI analysis
    triggerAIAnalysis(finalUrl);
  };

  // AI analysis triggers
  const triggerAIAnalysis = async (fileOrUrl: File | string) => {
    setStep("analyzing");
    try {
      const result = await aiService.analyzeImage(fileOrUrl);
      setAiResult(result);

      // Seed verification fields from AI
      setItemType(result.itemType);
      setBrand(result.brand);
      setCategoryName(result.category);
      setDamageLevelName(result.estimatedCondition);

      setStep("verify");
      toast.success("Analisis AI Vision selesai");
    } catch (e) {
      toast.error("AI Vision analisis gagal");
      setStep("photo");
    }
  };

  // Scan serial barcode triggers
  const handleScanSerial = async () => {
    setScanningSerial(true);
    try {
      const result = await aiService.scanSerialNumber(uploadedImageUrl || "demo.jpg");
      if (result.success && result.serialNumber) {
        setSerialCode(result.serialNumber);
        setNotes((n) => (n ? `${n}. ` : "") + `S/N: ${result.serialNumber} (${result.modelCode})`);
        toast.success(`Barcode Terdeteksi: ${result.serialNumber}`);
      } else {
        toast.error("Barcode tidak terbaca. Masukkan manual.");
      }
    } catch (err) {
      toast.error("Gagal memindai barcode");
    } finally {
      setScanningSerial(false);
    }
  };

  // Calculations
  const selectedCategory = EStore.getCategories().find(c => c.name === categoryName);
  const basePrice = selectedCategory ? selectedCategory.basePrice : 100;
  const selectedDamage = EStore.getDamageLevels().find(d => d.name === damageLevelName);
  const multiplier = selectedDamage ? selectedDamage.multiplier : 1.0;

  // Calculate points
  const pointsAwarded = manualPoints ?? Math.round(basePrice * weightKg * multiplier);

  // Carbon Emission saved (simulated multiplier based on category)
  // Laptops = 8.0, Gadgets = 4.8, Home items = 2.5, Accessories = 1.0 kg CO2 / kg
  let carbonFactor = 1.5;
  if (categoryName.includes("Komputer")) carbonFactor = 8.0;
  else if (categoryName.includes("Gadget")) carbonFactor = 4.8;
  else if (categoryName.includes("Rumah")) carbonFactor = 2.5;
  else if (categoryName.includes("Kabel")) carbonFactor = 1.0;
  const carbonSaved = parseFloat((weightKg * carbonFactor).toFixed(1));

  // Submit transaction
  const handleSubmitTransaction = async () => {
    if (!scannedUser) return;

    try {
      const tx = await dbService.createTransaction({
        officerId: "officer-uid",
        officerName: "Agus Saputra (Petugas DLH)",
        userId: scannedUser.uid,
        userName: scannedUser.fullName,
        itemType,
        brand,
        category: categoryName,
        weight: weightKg,
        damageLevel: damageLevelName,
        damageMultiplier: multiplier,
        points: pointsAwarded,
        photoUrl: uploadedImageUrl || "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=500",
        carbonSaved,
        notes: notes + (serialCode ? ` (Serial: ${serialCode})` : "")
      });

      setFinalTransaction(tx);
      setStep("receipt");
      toast.success("Transaksi berhasil dicatat & Poin ditransfer!");
    } catch (e) {
      toast.error("Gagal mencatat transaksi");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setScannedUser(null);
    setManualUid("");
    setUploadedImageUrl("");
    setAiResult(null);
    setWeightKg(1.0);
    setManualPoints(null);
    setNotes("");
    setSerialCode("");
    setFinalTransaction(null);
    setStep("scan");
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />

      {/* Title bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Catat Penyetoran E-Waste</h1>
          <p className="text-sm text-slate-500 font-medium">Layanan timbang dan konversi poin otomatis dengan bantuan AI Vision.</p>
        </div>

        {step !== "scan" && step !== "receipt" && (
          <button
            onClick={handleReset}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            <RotateCcwIcon className="h-4 w-4" /> Batal & Reset
          </button>
        )}
      </div>

      {/* Progress Wizard Header */}
      {step !== "receipt" && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold uppercase tracking-wider">
          <div className={`pb-2 border-b-2 transition-all ${step === "scan" ? "border-dlh-green-600 text-dlh-green-700" : "border-slate-200 text-slate-400"}`}>1. Scan Member</div>
          <div className={`pb-2 border-b-2 transition-all ${step === "photo" ? "border-dlh-green-600 text-dlh-green-700" : "border-slate-200 text-slate-400"}`}>2. Foto Sampah</div>
          <div className={`pb-2 border-b-2 transition-all ${step === "analyzing" ? "border-dlh-green-600 text-dlh-green-700" : "border-slate-200 text-slate-400"}`}>3. Deteksi AI</div>
          <div className={`pb-2 border-b-2 transition-all ${step === "verify" ? "border-dlh-green-600 text-dlh-green-700" : "border-slate-200 text-slate-400"}`}>4. Timbang & Verifikasi</div>
        </div>
      )}

      {/* Steps Content Cards */}
      <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">

        {/* STEP 1: SCAN MEMBER */}
        {step === "scan" && (
          <div className="space-y-8">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dlh-green-50 text-dlh-green-600 shadow-md">
                <QrCode className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Scan QR Code Penyetor</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Penyetor harus menunjukkan QR Code pribadi yang ada di profil aplikasi mereka. Scan QR tersebut untuk menarik profil.
              </p>
            </div>

            {/* Quick Demo select */}
            <div className="border rounded-2xl p-4 bg-slate-50 border-slate-200 text-slate-800 max-w-md mx-auto">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center mb-3">Simulasi Scanner - Pilih Penyetor Demo</span>
              <div className="grid grid-cols-2 gap-3">
                {EStore.getUsers().filter(u => u.role === "user").map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => handleScanUser(u)}
                    className="flex items-center gap-2.5 rounded-xl border bg-white p-3 text-left hover:border-dlh-green-500 hover:shadow-sm transition-all"
                  >
                    <img className="h-8 w-8 rounded-full" src={u.photoProfile || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`} alt="" />
                    <div className="truncate">
                      <span className="block text-xs font-bold text-slate-800 truncate">{u.fullName.split(" ")[0]}</span>
                      <span className="block text-[9px] text-slate-500 font-semibold">{u.points} Poin</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative max-w-xs mx-auto">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-bold uppercase tracking-wider">atau ketik manual</span>
              </div>
            </div>

            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="text"
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
                placeholder="ID Penyetor atau Email..."
                className="h-11 flex-1 border border-slate-200 rounded-2xl px-4 text-sm focus:border-dlh-green-500 outline-none"
              />
              <button
                onClick={handleManualLookup}
                className="h-11 px-5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl text-xs flex items-center gap-1 transition-all"
              >
                Cari <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PHOTO UPLOAD */}
        {step === "photo" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border">
              <img className="h-10 w-10 rounded-full" src={scannedUser?.photoProfile || `https://ui-avatars.com/api/?name=${scannedUser?.fullName}`} alt="" />
              <div>
                <span className="block text-xs font-semibold text-slate-400">Penyetor Terpilih</span>
                <span className="block text-sm font-bold text-slate-800">{scannedUser?.fullName}</span>
                <span className="block text-[10px] text-slate-500">{scannedUser?.phoneNumber || "No telepon tidak ada"} • {scannedUser?.address || "Alamat tidak ada"}</span>
              </div>
              {!isUserReady && (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Akun Belum Siap</span>
                    <p className="text-[10px] leading-tight">
                      Minta penyetor untuk membuka halaman profil dan menekan tombol "Muat Ulang Data" hingga Member ID muncul.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-extrabold text-slate-800">Unggah Foto Barang Elektronik</h2>
              <p className="text-xs text-slate-500 font-medium">Foto barang secara detail agar AI Vision dapat mendeteksi model fisik & estimasi kondisi.</p>
            </div>

            {/* Custom file upload box */}
            <div className="max-w-md mx-auto">
              <label
                htmlFor="waste-photo-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-dlh-green-500 hover:bg-dlh-green-50/20 transition-all"
              >
                {cloudinaryUploading ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-dlh-green-600" />
                    <span className="mt-4 text-xs font-bold text-slate-600">Mengunggah Foto ke Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                    <span className="mt-4 text-sm font-bold text-dlh-blue-600 hover:underline">Pilih / Ambil Foto Kamera</span>
                    <p className="mt-1 text-[10px] text-slate-500 font-semibold">Mendukung file JPG, PNG. Ukuran maks 5MB.</p>
                  </>
                )}
                <input
                  id="waste-photo-upload"
                  type="file"
                  accept="image/*"
                  disabled={cloudinaryUploading || !isUserReady}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelected(file);
                  }}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Quick Demo presets */}
            <div className="border rounded-2xl p-4 bg-slate-50 border-slate-200 max-w-md mx-auto">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center mb-3">Simulasi Foto - Pilih Sampah Demo</span>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_DEMO_IMAGES.map((img) => (
                  <button
                    key={img.name}
                    disabled={cloudinaryUploading || !isUserReady}
                    onClick={() => handleImageSelected(img.url)}
                    className="flex flex-col items-center gap-1 bg-white border rounded-xl p-1.5 hover:border-dlh-green-500 hover:shadow-xs transition-all disabled:opacity-50"
                  >
                    <img className="h-12 w-full rounded-lg object-cover" src={img.url} alt="" />
                    <span className="text-[9px] font-bold text-slate-600 truncate w-full text-center">{img.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ANALYZING AI VISION */}
        {step === "analyzing" && (
          <div className="text-center py-10 space-y-6">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-dlh-green-100 border-t-dlh-green-600 animate-spin" />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-dlh-green-50 text-dlh-green-600">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-800">Menghubungi AI Gemini Vision...</h2>
              <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                Harap tunggu, AI sedang menganalisis piksel gambar untuk mendeteksi jenis barang, sasis casing, dan goresan fisik.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: VERIFY AND SUBMIT */}
        {step === "verify" && (
          <div className="space-y-6">
            {/* AI Warning Alerts if confidence < 80% */}
            {aiResult && aiResult.confidenceScore < 80 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-amber-700">Skor Kepercayaan Rendah ({aiResult.confidenceScore}%)</span>
                  <p className="text-xs text-amber-800/90 leading-relaxed font-semibold">
                    AI kurang yakin terhadap hasil identifikasi. Mohon lakukan pemeriksaan manual & sesuaikan pilihan jika tidak cocok.
                  </p>
                </div>
              </div>
            )}

            {/* AI Success Banner */}
            {aiResult && aiResult.confidenceScore >= 80 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-emerald-800 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-dlh-green-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-dlh-green-700">Analisis AI Sukses ({aiResult.confidenceScore}%)</span>
                  <p className="text-xs text-emerald-800/80 leading-relaxed font-semibold">
                    AI mendeteksi: <strong>{aiResult.itemType} ({aiResult.brand})</strong>. Deskripsi: "{aiResult.description}"
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Photo Preview & Barcode Scanner */}
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden bg-slate-100 border">
                  <img className="h-64 w-full object-cover" src={uploadedImageUrl || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed"} alt="Preview" />
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm p-3 rounded-2xl text-white flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-200">Confidence AI: {aiResult?.confidenceScore}%</span>
                    <span className="text-xs font-extrabold">{aiResult?.estimatedCondition}</span>
                  </div>
                </div>

                {/* Scan serial code option */}
                <div className="rounded-2xl border p-4 bg-slate-50/60">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Membaca Nomor Seri (OCR Barcode)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={serialCode}
                      onChange={(e) => setSerialCode(e.target.value)}
                      placeholder="Masukkan atau scan nomor seri perangkat..."
                      className="h-10 flex-1 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:border-dlh-green-500 outline-none"
                    />
                    <button
                      onClick={handleScanSerial}
                      disabled={scanningSerial}
                      className="h-10 px-4 bg-dlh-blue-600 text-white font-bold rounded-xl text-xs hover:bg-dlh-blue-700 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {scanningSerial ? <Loader2 className="animate-spin h-4 w-4" /> : <Barcode className="h-4 w-4" />} Scan Barcode
                    </button>
                  </div>
                </div>
              </div>

              {/* Editing Form */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 flex items-center gap-1.5">
                  <HardHat className="h-4 w-4 text-slate-500" /> Verifikasi Form Petugas
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nama Barang</label>
                    <input type="text" value={itemType} onChange={(e) => setItemType(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Merek</label>
                    <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none">
                      {["Samsung", "Apple", "Xiaomi", "Oppo", "Vivo", "Asus", "Acer", "Lenovo", "HP", "Dell", "Sony", "Panasonic", "Sharp", "LG", "Philips", "Cosmos", "Logitech", "Epson"].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kategori (Poin Kunci)</label>
                  <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none">
                    {EStore.getCategories().map((c) => (
                      <option key={c.id} value={c.name}>{c.name} ({c.basePrice} P/kg)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tingkat Kerusakan</label>
                    <select value={damageLevelName} onChange={(e) => setDamageLevelName(e.target.value)} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none">
                      {EStore.getDamageLevels().map((d) => (
                        <option key={d.id} value={d.name}>{d.name} ({d.multiplier}x)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Berat Barang (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(parseFloat(e.target.value).toFixed(2)) || 0)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Catatan Tambahan Fisik</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tulis catatan jika ada sasis pecah..." className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-dlh-green-500 outline-none" />
                </div>

                {/* Manual Point Override */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Override Poin (Opsional)</label>
                  <input
                    type="number"
                    value={manualPoints ?? ""}
                    onChange={(e) => setManualPoints(e.target.value === "" ? null : parseInt(e.target.value))}
                    placeholder="Masukkan poin manual jika perlu"
                    className="w-full h-10 border border-amber-300 bg-amber-50 rounded-xl px-3 text-xs focus:border-amber-500 outline-none font-bold"
                  />
                </div>

                {/* Point Math Box */}
                <div className="rounded-2xl bg-dlh-green-50 border border-dlh-green-100 p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Nilai Dasar Kategori:</span>
                    <span className="font-bold text-slate-800">{basePrice} P/kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Berat Bersih:</span>
                    <span className="font-bold text-slate-800">{weightKg} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Faktor Kerusakan ({damageLevelName}):</span>
                    <span className="font-bold text-slate-800">{multiplier}x</span>
                  </div>
                  <hr className="border-dlh-green-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-extrabold text-dlh-green-800">Total Transfer Poin:</span>
                    <span className="text-lg font-extrabold text-dlh-green-600 bg-white border border-dlh-green-100 px-3 py-0.5 rounded-full shadow-xs">
                      +{pointsAwarded} Poin
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-dlh-green-700 font-semibold">
                    <span>Emisi Karbon Terkurangi:</span>
                    <span>{carbonSaved} kg CO2</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep("photo")}
                    className="w-1/3 h-11 border rounded-2xl text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Kembali
                  </button>
                  <button
                    onClick={handleSubmitTransaction}
                    className="w-2/3 h-11 bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 text-white text-xs font-bold rounded-2xl hover:from-dlh-green-700 hover:to-dlh-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Send className="h-4 w-4" /> Selesaikan & Kirim Poin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETED RECEIPT */}
        {step === "receipt" && finalTransaction && (
          <div className="space-y-6">
            <div className="text-center space-y-2 max-w-sm mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Transaksi Selesai</h2>
              <p className="text-xs text-slate-500 font-medium">Saldo poin berhasil ditambahkan ke member dan audit log tersimpan.</p>
            </div>

            {/* Receipt Form Container (printable section) */}
            <div id="print-receipt" className="max-w-md mx-auto border-2 border-slate-200 border-dashed rounded-3xl p-6 bg-slate-50/50 space-y-4">
              <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">BUKTI SETORAN RESMI</span>
                <h4 className="text-md font-extrabold text-slate-800">E-Waste Smart Exchange</h4>
                <span className="text-[10px] font-semibold text-slate-500">DINAS LINGKUNGAN HIDUP (DLH)</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>No. Transaksi:</span>
                  <strong className="text-slate-800 font-mono">{finalTransaction.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="text-slate-800">{new Date(finalTransaction.date).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Petugas:</span>
                  <span className="text-slate-800 font-semibold">{finalTransaction.officerName.split(" ")[0]}</span>
                </div>
                <hr className="border-dashed" />
                <div className="flex justify-between">
                  <span>Nama Penyetor:</span>
                  <strong className="text-slate-800">{finalTransaction.userName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Barang / Merek:</span>
                  <span className="text-slate-800 font-semibold">{finalTransaction.itemType} ({finalTransaction.brand})</span>
                </div>
                <div className="flex justify-between">
                  <span>Kategori:</span>
                  <span className="text-slate-800">{finalTransaction.category.split(" / ")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kondisi Fisik:</span>
                  <span className="text-slate-800 font-bold">{finalTransaction.damageLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Berat Barang:</span>
                  <strong className="text-slate-800">{finalTransaction.weight} kg</strong>
                </div>
                {finalTransaction.notes && (
                  <div className="flex justify-between">
                    <span>Catatan:</span>
                    <span className="text-slate-500 italic">{finalTransaction.notes}</span>
                  </div>
                )}
                <hr className="border-dashed" />
                <div className="flex justify-between items-center bg-dlh-green-50 p-2.5 rounded-xl border border-dlh-green-100">
                  <span className="text-xs font-bold text-dlh-green-800">Poin Ditransfer:</span>
                  <strong className="text-sm font-extrabold text-dlh-green-700">+{finalTransaction.points} POIN</strong>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 px-1 font-semibold">
                  <span>Carbon CO2 Terkurangi:</span>
                  <span>{finalTransaction.carbonSaved} kg CO2</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-slate-200">
                <p className="text-[10px] text-slate-400 font-semibold">
                  Terima kasih telah berpartisipasi menjaga lingkungan bersama Dinas Lingkungan Hidup.
                </p>
              </div>
            </div>

            <div className="flex gap-2 max-w-md mx-auto pt-2">
              <button
                onClick={handlePrint}
                className="w-1/2 h-11 border border-slate-200 hover:bg-slate-50 font-semibold rounded-2xl text-xs flex items-center justify-center gap-1 transition-all"
              >
                <Printer className="h-4.5 w-4.5" /> Cetak Bukti Setor
              </button>
              <button
                onClick={handleReset}
                className="w-1/2 h-11 bg-dlh-green-600 hover:bg-dlh-green-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                Selesai / Setor Lagi <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Sub components
function RotateCcwIcon(props: any) {
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
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
      <polyline points="21 3 21 8 16 8" />
    </svg>
  );
}
