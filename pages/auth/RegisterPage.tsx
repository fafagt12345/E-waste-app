import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Lock, Loader2, Recycle, Phone, MapPin } from "lucide-react";

export function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await register(email, password, fullName, phoneNumber, address);
      navigate("/login"); 
    } catch (err: any) {
      // Offline fallback registration support
      if (err.code === "auth/email-already-in-use" || err.message) {
        setError("Email ini sudah terdaftar. Silakan gunakan email lain.");
      } else {
        // Fallback save user directly in local list for demo
        const localUsers = JSON.parse(localStorage.getItem("ew_users") || "[]");
        const alreadyHas = localUsers.some((u: any) => u.email === email);
        if (alreadyHas) {
          setError("Email ini sudah terdaftar.");
          setLoading(false);
          return;
        }
        const newUser = {
          uid: `user-${Date.now()}`,
          email,
          fullName,
          phoneNumber,
          address,
          role: "user" as const,
          points: 0,
          carbonReduced: 0,
          badges: ["Eco Explorer"],
          createdAt: new Date().toISOString()
        };
        localUsers.push(newUser);
        localStorage.setItem("ew_users", JSON.stringify(localUsers));
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-dlh-green-900 via-dlh-blue-900 to-dlh-green-950 p-4 font-sans">
      {/* Background Decorative Rings */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-dlh-green-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-dlh-blue-500/20 blur-3xl" />
      
      <div className="w-full max-w-md space-y-6 z-10">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            {/* Logo Badge */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-dlh-green-500 via-dlh-green-600 to-dlh-blue-600 text-white shadow-lg shadow-dlh-green-600/30">
              <Recycle className="h-9 w-9" />
            </div>
            
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-dlh-green-700 to-dlh-blue-700 bg-clip-text text-transparent">
              Daftar Eco Hero Baru
            </h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-dlh-green-600">
              E-Waste Smart Exchange
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Bergabung untuk menyelamatkan lingkungan & kumpulkan poin voucher!
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200"
                  placeholder="081234567890"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Alamat Lengkap</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-24 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200 resize-none"
                  placeholder="Masukkan alamat lengkap rumah Anda"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200"
                  placeholder="Buat password (min. 8 karakter)"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200"
                  placeholder="Ulangi password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-center text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-dlh-green-600/20 hover:from-dlh-green-700 hover:to-dlh-blue-700 focus:outline-none focus:ring-2 focus:ring-dlh-green-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 transform active:scale-95"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              Buat Akun Sekarang
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah memiliki akun?{" "}
            <Link to="/login" className="font-semibold text-dlh-blue-600 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
