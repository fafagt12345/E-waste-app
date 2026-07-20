import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Mail, Lock, Loader2, Chrome, Recycle, Shield, UserCheck, HardHat } from "lucide-react";

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"idle" | "email" | "google">("idle");
  const navigate = useNavigate();

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading("email");
    setError(null);

    try {
      await loginWithEmail(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError("Email atau password salah. Silakan coba lagi.");
    } finally {
      setLoading("idle");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading("google");
    setError(null);

    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      setError("Gagal login dengan Google. Menggunakan akun demo.");
      // Fallback user for demo
      setEmail("user@ewaste.com");
      setPassword("user123");
    } finally {
      setLoading("idle");
    }
  };

  const autofillDemo = (role: "admin" | "petugas" | "petugas2" | "user") => {
    if (role === "admin") {
      setEmail("admin@ewaste.com");
      setPassword("admin123");
    } else if (role === "petugas") {
      setEmail("petugas@ewaste.com");
      setPassword("petugas123");
    } else if (role === "petugas2") {
      setEmail("petugas2@ewaste.com");
      setPassword("petugas123");
    } else {
      setEmail("user@ewaste.com");
      setPassword("user123");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-dlh-green-900 via-dlh-blue-900 to-dlh-green-950 p-4 font-sans">
      {/* Background Decorative Rings */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-dlh-green-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-dlh-blue-500/20 blur-3xl" />
      <div className="absolute left-1/3 top-1/4 h-60 w-60 rounded-full bg-dlh-yellow-500/10 blur-3xl" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="glass rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:shadow-dlh-green-500/10">
          <div className="flex flex-col items-center text-center">
            {/* Logo Badge */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-dlh-green-500 via-dlh-green-600 to-dlh-blue-600 text-white shadow-lg shadow-dlh-green-600/30">
              <Recycle className="h-9 w-9 animate-spin-slow" />
            </div>
            
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-dlh-green-700 to-dlh-blue-700 bg-clip-text text-transparent">
              E-Waste Smart Exchange
            </h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-dlh-green-600">
              Dinas Lingkungan Hidup
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Penukaran Sampah Elektronik Jadi Voucher Listrik
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200"
                  placeholder="email@contoh.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
                <Link to="/login" className="text-xs font-medium text-dlh-blue-600 hover:underline">Lupa Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/70 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-dlh-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20 transition-all duration-200"
                  placeholder="Masukkan password"
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
              disabled={loading !== "idle"}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-dlh-green-600/20 hover:from-dlh-green-700 hover:to-dlh-blue-700 focus:outline-none focus:ring-2 focus:ring-dlh-green-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 transform active:scale-95"
            >
              {loading === "email" && <Loader2 className="animate-spin" size={18} />}
              Masuk ke Aplikasi
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/90 px-3 text-slate-400">atau masuk lewat</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading !== "idle"}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "google" ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Chrome size={18} className="text-red-500" />
            )}
            <span>Sign In dengan Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link to="/daftar" className="font-semibold text-dlh-green-600 hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>


      </div>
    </div>
  );
}
