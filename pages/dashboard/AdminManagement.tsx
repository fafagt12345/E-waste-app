import { useState, useEffect } from "react";
import { EStore, dbService, UserProfile, Voucher, EItemCategory, WasteBankLocation, Announcement, Booking } from "../../services/db";
import { 
  Users, 
  HardHat, 
  Ticket, 
  ListFilter, 
  MapPin, 
  Megaphone, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X,
  Truck
} from "lucide-react";
import { toast, Toaster } from "sonner";

type Tab = "users" | "officers" | "bookings" | "vouchers" | "categories" | "locations" | "announcements";

export function AdminManagement() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data States
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [vouchersList, setVouchersList] = useState<Voucher[]>([]);
  const [categoriesList, setCategoriesList] = useState<EItemCategory[]>([]);
  const [locationsList, setLocationsList] = useState<WasteBankLocation[]>([]);
  const [newsList, setNewsList] = useState<Announcement[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [formUserRole, setFormUserRole] = useState<"admin" | "petugas" | "user">("user");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPoints, setFormPoints] = useState(0);
  const [formLocationId, setFormLocationId] = useState(""); // For Officer Branch Assignment
  const [formVoucherTitle, setFormVoucherTitle] = useState("");
  const [formVoucherCost, setFormVoucherCost] = useState(0);
  const [formVoucherStock, setFormVoucherStock] = useState(0);
  const [formCategoryName, setFormCategoryName] = useState("");
  const [formCategoryPrice, setFormCategoryPrice] = useState(0);
  const [formLocationName, setFormLocationName] = useState("");
  const [formLocationAddress, setFormLocationAddress] = useState("");
  const [formLocationHours, setFormLocationHours] = useState("");
  const [formNewsTitle, setFormNewsTitle] = useState("");
  const [formNewsContent, setFormNewsContent] = useState("");
  const [formNewsCat, setFormNewsCat] = useState<"edukasi" | "pengumuman">("pengumuman");

  // Filter Bookings by Location
  const [filterLocationId, setFilterLocationId] = useState("");

  // Load all data
  const loadData = async () => {
    setUsersList(await dbService.getUsers());
    setVouchersList(await dbService.getVouchers());
    setCategoriesList(EStore.getCategories());
    setLocationsList(await dbService.getLocations());
    setNewsList(await dbService.getAnnouncements());
    setBookingsList(await dbService.getBookings());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling for real-time updates
    return () => clearInterval(interval);
  }, []);

  const handleOpenAddModal = () => {
    setEditId(null);
    setFormName("");
    setFormEmail("");
    setFormPoints(0);
    setFormLocationId(locationsList[0]?.id || "");
    setFormVoucherTitle("");
    setFormVoucherCost(100);
    setFormVoucherStock(20);
    setFormCategoryName("");
    setFormCategoryPrice(100);
    setFormLocationName("");
    setFormLocationAddress("");
    setFormLocationHours("Senin - Jumat (08:00 - 15:00)");
    setFormNewsTitle("");
    setFormNewsContent("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditId(item.id || item.uid);
    if (activeTab === "users" || activeTab === "officers") {
      setFormName(item.fullName);
      setFormEmail(item.email);
      setFormPoints(item.points);
      setFormUserRole(item.role);
      setFormLocationId(item.locationId || "");
    } else if (activeTab === "vouchers") {
      setFormVoucherTitle(item.title);
      setFormVoucherCost(item.cost);
      setFormVoucherStock(item.stock);
    } else if (activeTab === "categories") {
      setFormCategoryName(item.name);
      setFormCategoryPrice(item.basePrice);
    } else if (activeTab === "locations") {
      setFormLocationName(item.name);
      setFormLocationAddress(item.address);
      setFormLocationHours(item.hours);
    } else if (activeTab === "announcements") {
      setFormNewsTitle(item.title);
      setFormNewsContent(item.content);
      setFormNewsCat(item.category);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === "users" || activeTab === "officers") {
        const users = EStore.getUsers();
        const matchedLoc = locationsList.find(l => l.id === formLocationId);

        if (editId) {
          const dataToUpdate: Partial<UserProfile> = { 
            fullName: formName, 
            email: formEmail, 
            points: formPoints, 
            role: activeTab === "officers" ? "petugas" : formUserRole,
            locationId: (activeTab === "officers" || formUserRole === "petugas") ? formLocationId : undefined,
            locationName: (activeTab === "officers" || formUserRole === "petugas") ? (matchedLoc?.name || "") : undefined
          };
          await dbService.updateUserProfile(editId, dataToUpdate);
          toast.success("Akun berhasil diperbarui dan disinkronisasi dengan database");
          loadData(); // Refresh UI
        } else {
          const newUser: UserProfile = {
            uid: `user-${Date.now()}`,
            email: formEmail,
            fullName: formName,
            role: activeTab === "officers" ? "petugas" : formUserRole,
            points: formPoints,
            carbonReduced: 0,
            badges: [],
            createdAt: new Date().toISOString(),
            locationId: activeTab === "officers" ? formLocationId : undefined,
            locationName: activeTab === "officers" ? (matchedLoc?.name || "") : undefined
          };
          users.push(newUser);
          EStore.saveUsers(users);
          toast.success("Akun baru berhasil ditambahkan");
        }
      } else if (activeTab === "vouchers") {
        const list = EStore.getVouchers();
        if (editId) {
          const idx = list.findIndex((v) => v.id === editId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], title: formVoucherTitle, cost: formVoucherCost, stock: formVoucherStock };
            EStore.saveVouchers(list);
            toast.success("Voucher berhasil diperbarui");
          }
        } else {
          const newVoucher = {
            id: `v-${Date.now()}`,
            title: formVoucherTitle,
            cost: formVoucherCost,
            value: formVoucherCost * 150,
            stock: formVoucherStock,
            category: "listrik" as const,
            codePrefix: "PLN" + (formVoucherCost * 150 / 1000) + "K"
          };
          list.push(newVoucher);
          EStore.saveVouchers(list);
          toast.success("Voucher baru berhasil ditambahkan");
        }
      } else if (activeTab === "categories") {
        const list = EStore.getCategories();
        if (editId) {
          const idx = list.findIndex((c) => c.id === editId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], name: formCategoryName, basePrice: formCategoryPrice };
            EStore.saveCategories(list);
            toast.success("Kategori berhasil diperbarui");
          }
        } else {
          const newCat = {
            id: `cat-${Date.now()}`,
            name: formCategoryName,
            basePrice: formCategoryPrice,
            description: `Kategori elektronik ${formCategoryName}`
          };
          list.push(newCat);
          EStore.saveCategories(list);
          toast.success("Kategori baru berhasil ditambahkan");
        }
      } else if (activeTab === "locations") {
        const list = EStore.getLocations();
        if (editId) {
          const idx = list.findIndex((l) => l.id === editId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], name: formLocationName, address: formLocationAddress, hours: formLocationHours };
            EStore.saveLocations(list);
            toast.success("Lokasi berhasil diperbarui");
          }
        } else {
          const newLoc = {
            id: `loc-${Date.now()}`,
            name: formLocationName,
            address: formLocationAddress,
            lat: -7.250 + (Math.random() - 0.5) * 0.1,
            lng: 112.750 + (Math.random() - 0.5) * 0.1,
            phone: "0812-xxxx-xxxx",
            hours: formLocationHours
          };
          list.push(newLoc);
          EStore.saveLocations(list);
          toast.success("Lokasi baru berhasil ditambahkan");
        }
      } else if (activeTab === "announcements") {
        const list = EStore.getNews();
        if (editId) {
          const idx = list.findIndex((n) => n.id === editId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], title: formNewsTitle, content: formNewsContent, category: formNewsCat };
            EStore.saveNews(list);
            toast.success("Pengumuman berhasil diperbarui");
          }
        } else {
          const newNews = {
            id: `news-${Date.now()}`,
            title: formNewsTitle,
            content: formNewsContent,
            date: new Date().toISOString().split("T")[0],
            author: "Admin DLH",
            category: formNewsCat
          };
          list.push(newNews);
          EStore.saveNews(list);
          toast.success("Pengumuman baru berhasil ditambahkan");
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Gagal menyimpan data");
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      if (activeTab === "users" || activeTab === "officers") {
        const list = EStore.getUsers();
        EStore.saveUsers(list.filter((u) => u.uid !== id));
        toast.success("Akun berhasil dihapus");
      } else if (activeTab === "vouchers") {
        const list = EStore.getVouchers();
        EStore.saveVouchers(list.filter((v) => v.id !== id));
        toast.success("Voucher berhasil dihapus");
      } else if (activeTab === "categories") {
        const list = EStore.getCategories();
        EStore.saveCategories(list.filter((c) => c.id !== id));
        toast.success("Kategori berhasil dihapus");
      } else if (activeTab === "locations") {
        const list = EStore.getLocations();
        EStore.saveLocations(list.filter((l) => l.id !== id));
        toast.success("Lokasi berhasil dihapus");
      } else if (activeTab === "announcements") {
        const list = EStore.getNews();
        EStore.saveNews(list.filter((n) => n.id !== id));
        toast.success("Pengumuman berhasil dihapus");
      }
      loadData();
    } catch (err) {
      toast.error("Gagal menghapus data");
    }
  };

  // Filter lists based on search
  const filteredUsers = usersList.filter((u) => u.role === "user" && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredOfficers = usersList.filter((u) => u.role === "petugas" && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredVouchers = vouchersList.filter((v) => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCategories = categoriesList.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredLocations = locationsList.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNews = newsList.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 font-sans">
      <Toaster position="top-right" richColors />
      
      {/* Title section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Konsol Manajemen Admin</h1>
          <p className="text-sm text-slate-500">Kelola pengguna, staf lapangan, wilayah bank sampah, voucher, dan antrean booking.</p>
        </div>
        {activeTab !== "bookings" && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-dlh-green-600 to-dlh-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-dlh-green-700 hover:to-dlh-blue-700 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" /> Tambah Data Baru
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "users" ? "bg-dlh-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" /> Kelola Penyetor
        </button>
        <button
          onClick={() => { setActiveTab("officers"); setSearchQuery(""); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "officers" ? "bg-dlh-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <HardHat className="h-4 w-4" /> Kelola Petugas
        </button>
        <button
          onClick={() => { setActiveTab("bookings"); setSearchQuery(""); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "bookings" ? "bg-dlh-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="h-4 w-4" /> Antrean Booking
        </button>
        <button
          onClick={() => { setActiveTab("vouchers"); setSearchQuery(""); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "vouchers" ? "bg-dlh-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ticket className="h-4 w-4" /> Stok Voucher
        </button>
        <button
          onClick={() => { setActiveTab("categories"); setSearchQuery(""); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "categories" ? "bg-dlh-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ListFilter className="h-4 w-4" /> Kategori & Harga
        </button>
        <button
          onClick={() => { setActiveTab("locations"); setSearchQuery(""); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "locations" ? "bg-dlh-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MapPin className="h-4 w-4" /> Lokasi Bank Sampah
        </button>
        <button
          onClick={() => { setActiveTab("announcements"); setSearchQuery(""); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "announcements" ? "bg-dlh-green-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Megaphone className="h-4 w-4" /> Edukasi & Pengumuman
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Cari data ${activeTab === "users" ? "penyetor" : activeTab === "officers" ? "petugas" : activeTab === "bookings" ? "ID booking" : "item"}...`}
          className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 focus:border-dlh-green-500 focus:outline-none focus:ring-2 focus:ring-dlh-green-500/20"
        />
      </div>

      {/* Tables Grid */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm overflow-hidden">
        
        {/* USERS TABLE */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Nama Penyetor</th>
                  <th className="py-3 px-4">Info Kontak</th>
                  <th className="py-3 px-4">Saldo Poin</th>
                  <th className="py-3 px-4">Kontribusi Karbon</th>
                  <th className="py-3 px-4 text-center rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-semibold text-slate-800">{u.fullName}</td>
                    <td className="py-4 px-4 text-slate-500 text-sm">
                      <div className="font-medium">{u.email}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{u.phoneNumber || "No telepon tidak ada"}</div>
                      <div className="text-xs text-slate-400 max-w-[200px] truncate" title={u.address}>{u.address || "Alamat tidak ada"}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-extrabold text-dlh-green-600 bg-dlh-green-50 px-3 py-1 rounded-full text-xs">
                        {u.points} Poin
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{u.carbonReduced} kg CO2</td>
                    <td className="py-4 px-4 text-center space-x-2">
                      <button onClick={() => handleOpenEditModal(u)} className="p-1.5 text-dlh-blue-600 hover:bg-dlh-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(u.uid)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* OFFICERS TABLE */}
        {activeTab === "officers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Nama Petugas</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Penugasan Wilayah</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOfficers.map((o) => (
                  <tr key={o.uid} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-semibold text-slate-800">{o.fullName}</td>
                    <td className="py-4 px-4 text-slate-500">{o.email}</td>
                    <td className="py-4 px-4 text-slate-700 font-semibold">{o.locationName || "Semua Cabang (Pusat)"}</td>
                    <td className="py-4 px-4"><span className="text-xs font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{o.role}</span></td>
                    <td className="py-4 px-4 text-center space-x-2">
                      <button onClick={() => handleOpenEditModal(o)} className="p-1.5 text-dlh-blue-600 hover:bg-dlh-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(o.uid)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BOOKINGS TABLE */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Filter Kantor Wilayah:</span>
              <select
                value={filterLocationId}
                onChange={(e) => setFilterLocationId(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 font-bold outline-none"
              >
                <option value="">Semua Wilayah</option>
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 rounded-l-2xl">ID Booking</th>
                    <th className="py-3 px-4">Nama Penyetor</th>
                    <th className="py-3 px-4">Kantor Tujuan</th>
                    <th className="py-3 px-4">Jadwal Sesi</th>
                    <th className="py-3 px-4">Detail Barang</th>
                    <th className="py-3 px-4 text-center rounded-r-2xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookingsList
                    .filter((b) => !filterLocationId || b.locationId === filterLocationId)
                    .filter((b) => b.userName.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4 font-mono font-bold text-slate-500">{b.id}</td>
                        <td className="py-4 px-4 font-semibold text-slate-800">{b.userName}</td>
                        <td className="py-4 px-4 text-slate-600 font-medium">{b.locationName}</td>
                        <td className="py-4 px-4 font-semibold text-slate-500">{b.date} ({b.timeSlot})</td>
                        <td className="py-4 px-4 text-slate-700">
                          <strong>{b.itemName || b.itemPreview}</strong> {b.brand ? `(${b.brand})` : ""}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            b.status === "completed" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-dlh-blue-50 text-dlh-blue-700 border border-dlh-blue-100 animate-pulse"
                          }`}>
                            {b.status === "scheduled" ? "Terjadwal" : "Selesai"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VOUCHERS TABLE */}
        {activeTab === "vouchers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Nama Voucher</th>
                  <th className="py-3 px-4">Biaya Poin</th>
                  <th className="py-3 px-4">Nilai Nominal</th>
                  <th className="py-3 px-4">Stok Tersedia</th>
                  <th className="py-3 px-4 text-center rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-semibold text-slate-800">{v.title}</td>
                    <td className="py-4 px-4 font-bold text-dlh-green-600">{v.cost} P</td>
                    <td className="py-4 px-4 font-semibold text-slate-700">Rp {v.value.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-4 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${v.stock < 10 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {v.stock} unit
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center space-x-2">
                      <button onClick={() => handleOpenEditModal(v)} className="p-1.5 text-dlh-blue-600 hover:bg-dlh-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CATEGORIES TABLE */}
        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Kategori Sampah</th>
                  <th className="py-3 px-4">Harga Dasar Poin</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4 text-center rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-4 px-4 font-bold text-dlh-green-600">{c.basePrice} P/kg</td>
                    <td className="py-4 px-4 text-slate-500">{c.description}</td>
                    <td className="py-4 px-4 text-center space-x-2">
                      <button onClick={() => handleOpenEditModal(c)} className="p-1.5 text-dlh-blue-600 hover:bg-dlh-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LOCATIONS TABLE */}
        {activeTab === "locations" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Nama Unit Bank</th>
                  <th className="py-3 px-4">Alamat Unit</th>
                  <th className="py-3 px-4">Jam Buka</th>
                  <th className="py-3 px-4 text-center rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLocations.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-semibold text-slate-800">{l.name}</td>
                    <td className="py-4 px-4 text-slate-500">{l.address}</td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{l.hours}</td>
                    <td className="py-4 px-4 text-center space-x-2">
                      <button onClick={() => handleOpenEditModal(l)} className="p-1.5 text-dlh-blue-600 hover:bg-dlh-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ANNOUNCEMENTS TABLE */}
        {activeTab === "announcements" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Judul Konten</th>
                  <th className="py-3 px-4">Isi Deskripsi</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4 text-center rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNews.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-semibold text-slate-800 max-w-xs truncate">{n.title}</td>
                    <td className="py-4 px-4 text-slate-500 max-w-sm truncate">{n.content}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${n.category === "edukasi" ? "bg-dlh-blue-50 text-dlh-blue-700" : "bg-dlh-yellow-50 text-dlh-yellow-800"}`}>
                        {n.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center space-x-2">
                      <button onClick={() => handleOpenEditModal(n)} className="p-1.5 text-dlh-blue-600 hover:bg-dlh-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(n.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL DOCK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-extrabold text-slate-800">{editId ? "Edit" : "Tambah"} Data {activeTab.toUpperCase()}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Conditional Form Inputs based on active tab */}
              {(activeTab === "users" || activeTab === "officers") && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label>
                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  
                  {/* Select Branch Office specifically for Officers or when Role is set to Petugas */}
                  {(activeTab === "officers" || formUserRole === "petugas") && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kantor Cabang / Penugasan Wilayah</label>
                      <select 
                        value={formLocationId} 
                        onChange={(e) => setFormLocationId(e.target.value)} 
                        className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none bg-white font-semibold text-slate-700"
                        required
                      >
                        <option value="">Pilih Cabang</option>
                        {locationsList.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activeTab === "users" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Hak Akses / Role</label>
                        <select value={formUserRole} onChange={(e) => setFormUserRole(e.target.value as any)} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none">
                          <option value="user">User / Penyetor</option>
                          <option value="petugas">Petugas Lapangan</option>
                          <option value="admin">Admin Dinas</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Saldo Poin</label>
                        <input type="number" value={formPoints} onChange={(e) => setFormPoints(parseInt(e.target.value))} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === "vouchers" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Voucher Listrik</label>
                    <input type="text" value={formVoucherTitle} onChange={(e) => setFormVoucherTitle(e.target.value)} placeholder="PLN Rp 50.000" className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Biaya Poin penukaran</label>
                    <input type="number" value={formVoucherCost} onChange={(e) => setFormVoucherCost(parseInt(e.target.value))} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Stok Voucher</label>
                    <input type="number" value={formVoucherStock} onChange={(e) => setFormVoucherStock(parseInt(e.target.value))} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                </>
              )}

              {activeTab === "categories" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Kategori Sampah</label>
                    <input type="text" value={formCategoryName} onChange={(e) => setFormCategoryName(e.target.value)} placeholder="Monitor TV" className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Harga Dasar Poin (per kg)</label>
                    <input type="number" value={formCategoryPrice} onChange={(e) => setFormCategoryPrice(parseInt(e.target.value))} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                </>
              )}

              {activeTab === "locations" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Unit Bank Sampah</label>
                    <input type="text" value={formLocationName} onChange={(e) => setFormLocationName(e.target.value)} placeholder="Bank Sampah Unit 4" className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Alamat Unit</label>
                    <input type="text" value={formLocationAddress} onChange={(e) => setFormLocationAddress(e.target.value)} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Jam Operasional</label>
                    <input type="text" value={formLocationHours} onChange={(e) => setFormLocationHours(e.target.value)} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                </>
              )}

              {activeTab === "announcements" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Judul Konten</label>
                    <input type="text" value={formNewsTitle} onChange={(e) => setFormNewsTitle(e.target.value)} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kategori Konten</label>
                    <select value={formNewsCat} onChange={(e) => setFormNewsCat(e.target.value as any)} className="w-full h-10 border rounded-xl px-3 text-sm focus:border-dlh-green-500 outline-none">
                      <option value="pengumuman">Pengumuman Sistem</option>
                      <option value="edukasi">Edukasi E-Waste</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Deskripsi Konten</label>
                    <textarea value={formNewsContent} onChange={(e) => setFormNewsContent(e.target.value)} rows={4} className="w-full border rounded-xl p-3 text-sm focus:border-dlh-green-500 outline-none" required />
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-4 rounded-xl text-slate-500 hover:bg-slate-100 text-sm font-semibold">Batal</button>
                <button type="submit" className="h-10 px-6 rounded-xl bg-dlh-green-600 hover:bg-dlh-green-700 text-white text-sm font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
