export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
