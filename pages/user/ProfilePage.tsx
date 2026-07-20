import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../config";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { User, Mail, Phone, MapPin, Loader2, Camera } from "lucide-react";

export function ProfilePage() {
  const { profile, loading: authLoading, reloadProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mengisi form dengan data profil saat komponen dimuat
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhoneNumber(profile.phoneNumber || "");
      setAddress(profile.address || "");
    }
  }, [profile]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) { // Batas 5MB
      setError("Ukuran foto tidak boleh lebih dari 5MB.");
      return;
    }

    const storageRef = ref(storage, `profile_pictures/${profile.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    setError(null);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setError("Gagal mengunggah foto. Silakan coba lagi.");
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const userDocRef = doc(db, "users", profile.uid);
          await updateDoc(userDocRef, { photoProfile: downloadURL });

          // Muat ulang profil untuk memperbarui UI
          await reloadProfile();

          setSuccess("Foto profil berhasil diperbarui!");
        } catch (updateError) {
          setError("Gagal menyimpan URL foto baru.");
        } finally {
          setUploading(false);
        }
      }
    );
  };

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      setError("Profil pengguna tidak ditemukan.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userDocRef = doc(db, "users", profile.uid);
      await updateDoc(userDocRef, {
        fullName,
        phone: phoneNumber,
        address,
      });
      setSuccess("Profil berhasil diperbarui!");
    } catch (err: any) {
      setError("Gagal memperbarui profil. Silakan coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="text-center p-10">Memuat profil...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Profil</h1>
      <p className="text-gray-500 mb-6">Perbarui informasi pribadi Anda di sini.</p>

      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="relative">
          <img
            src={profile?.photoProfile || `https://ui-avatars.com/api/?name=${profile?.fullName}&background=22c55e&color=fff&size=128`}
            alt="Foto Profil"
            className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 h-10 w-10 bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-transform"
            aria-label="Ubah foto profil"
            disabled={uploading}
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden"
            accept="image/png, image/jpeg"
          />
        </div>
        {uploading && <div className="text-sm font-semibold text-gray-600">Mengunggah: {Math.round(uploadProgress)}%</div>}
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 p-3 border rounded-md focus:ring-dlh-green-500 focus:border-dlh-green-500" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (tidak dapat diubah)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="email" value={profile?.email || ""} className="w-full pl-10 p-3 border rounded-md bg-gray-100 cursor-not-allowed" readOnly />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full pl-10 p-3 border rounded-md focus:ring-dlh-green-500 focus:border-dlh-green-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-4 text-gray-400" size={20} />
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full pl-10 p-3 border rounded-md h-24 resize-none focus:ring-dlh-green-500 focus:border-dlh-green-500" />
          </div>
        </div>

        {error && <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-md">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center p-2 bg-green-50 rounded-md">{success}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-dlh-green-700 hover:to-dlh-blue-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}