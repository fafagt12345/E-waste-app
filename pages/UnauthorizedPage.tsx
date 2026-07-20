import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md text-center">
        <ShieldAlert className="mx-auto h-20 w-20 text-red-500" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">Akses Ditolak</h1>
        <p className="mt-4 text-slate-600">Maaf, Anda tidak memiliki izin yang diperlukan untuk mengakses halaman ini.</p>
        <Link to="/dashboard" className="mt-8 inline-block rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
