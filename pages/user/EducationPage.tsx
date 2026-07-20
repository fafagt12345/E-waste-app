import { BookOpen, Sparkles, ShieldAlert, CheckCircle, Lightbulb } from "lucide-react";

export function EducationPage() {
  const articles = [
    {
      title: "Mengenal Bahaya Racun di Dalam E-Waste",
      category: "Dasar Lingkungan",
      icon: ShieldAlert,
      color: "text-red-600 bg-red-50 border-red-200",
      content: "Sampah elektronik (E-Waste) mengandung logam berat yang sangat beracun seperti timbal, merkuri, kadmium, dan kromium heksavalen. Ketika e-waste dibakar atau dibuang ke tempat pembuangan sampah biasa, zat berbahaya ini meresap ke dalam air tanah dan mencemari ekosistem pertanian kita."
    },
    {
      title: "Panduan Penanganan Baterai Lithium yang Aman",
      category: "Keselamatan Kerja",
      icon: Lightbulb,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      content: "Baterai ponsel, laptop, dan powerbank yang kembung adalah hazard kebakaran serius. Jangan menusuk casing baterai dan hindari membuangnya di tempat sampah biasa. Bawa segera ke unit bank sampah DLH terdekat untuk didaur ulang secara khusus."
    },
    {
      title: "Manfaat Nyata Daur Ulang Logam Mulia E-Waste",
      category: "Ekonomi Sirkular",
      icon: Sparkles,
      color: "text-dlh-green-700 bg-dlh-green-50 border-dlh-green-200",
      content: "Tahukah Anda bahwa satu ton papan sirkuit sirkuit handphone (motherboard) mengandung emas 40 hingga 800 kali lebih banyak dibandingkan satu ton bijih tambang emas mentah? Melalui Urban Mining, kita menghemat energi penambangan secara masif."
    }
  ];

  const sortingSteps = [
    { step: 1, title: "Pisahkan Baterai", desc: "Jika memungkinkan, lepas baterai lithium dari HP/laptop sebelum diserahkan." },
    { step: 2, title: "Kumpulkan Aksesoris", desc: "Satukan kabel, charger rusak, headphone, dan keyboard ke kantong khusus." },
    { step: 3, title: "Gunakan Layanan Booking", desc: "Buat jadwal penjemputan/penyerahan di aplikasi E-Waste untuk menghemat antrean." }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Hero Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Edukasi & Literasi E-Waste</h1>
        <p className="text-sm text-slate-500 font-medium">Pelajari bahaya sampah elektronik, tips pemilahan aman, dan dampaknya bagi kelestarian bumi Magetan.</p>
      </div>

      {/* Articles Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {articles.map((art) => (
          <div key={art.title} className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${art.color} border`}>
              <art.icon className="h-4 w-4" />
              {art.category}
            </div>
            <h3 className="text-base font-extrabold text-slate-800 leading-snug">{art.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{art.content}</p>
          </div>
        ))}
      </div>

      {/* How to sort section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Guide Panel */}
        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-dlh-green-600" /> Cara Memilah E-Waste dengan Benar
            </h3>
            <p className="text-xs text-slate-500">Langkah mudah memisahkan sampah elektronik di rumah Anda</p>
          </div>

          <div className="space-y-4">
            {sortingSteps.map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dlh-green-50 text-dlh-green-700 font-extrabold text-xs">
                  {s.step}
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-slate-800">{s.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fact Card */}
        <div className="rounded-3xl bg-gradient-to-tr from-dlh-green-800 to-dlh-blue-900 p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 h-40 w-40 bg-white/5 rounded-full blur-2xl" />
          <div className="space-y-4 relative z-10">
            <span className="inline-flex text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2 py-0.5 rounded">Fakta Lingkungan</span>
            <h3 className="text-xl font-extrabold leading-snug">Daur Ulang 1 Juta HP Menyelamatkan Ribuan Kilogram Logam Mulia</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
              Menurut studi EPA, mendaur ulang 1 juta ponsel menghasilkan sekitar 16.000 kg tembaga, 350 kg perak, 34 kg emas, dan 15 kg paladium. Ini mengurangi kebutuhan penambangan baru yang merusak ekosistem hutan hujan tropis.
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold mt-6">
            <CheckCircle className="h-4 w-4" /> Mari jadikan Magetan bebas E-Waste!
          </div>
        </div>
      </div>
    </div>
  );
}
