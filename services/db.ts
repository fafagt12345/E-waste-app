import { db, functions } from "../config";
import { doc, getDoc, setDoc, getDocs, collection, addDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

// Define Roles
export type Role = "admin" | "petugas" | "user";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: Role;
  points: number;
  photoProfile?: string;
  carbonReduced: number; // in kg CO2
  badges: string[];
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  locationId?: string;
  locationName?: string;
}

export interface WasteBankLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  hours: string;
}

export interface EItemCategory {
  id: string;
  name: string;
  basePrice: number; // point per kg
  description: string;
}

export interface DamageLevel {
  id: string;
  name: string;
  multiplier: number;
}

export interface Voucher {
  id: string;
  title: string;
  cost: number;
  value: number; // in Rp
  stock: number;
  category: "listrik" | "pulsa" | "other";
  codePrefix: string;
}

export interface Transaction {
  id: string;
  date: string;
  officerId: string;
  officerName: string;
  userId: string;
  userName: string;
  itemType: string;
  brand: string;
  category: string;
  weight: number;
  damageLevel: string;
  damageMultiplier: number;
  points: number;
  photoUrl: string;
  status: "pending" | "approved" | "rejected";
  carbonSaved: number;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: "edukasi" | "pengumuman";
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  locationId: string;
  locationName: string;
  date: string;
  timeSlot: string;
  itemPreview: string;
  status: "scheduled" | "completed" | "cancelled";
  itemName?: string;
  brand?: string;
  condition?: string;
  userPhotos?: string[];
  userPhotoLabels?: string[];
  officerPhotos?: string[];
  pointsAwarded?: number;
  weightReceived?: number;
}

// -------------------------------------------------------------
// SEED MOCK DATA (stored in LocalStorage for bulletproof demo)
// -------------------------------------------------------------

const DEFAULT_LOCATIONS: WasteBankLocation[] = [
  { id: "loc-1", name: "Bank Sampah Induk DLH Kota", address: "Jl. Adisucipto No.45, Pusat Kota", lat: -7.250445, lng: 112.768845, phone: "0811-2233-4455", hours: "Senin - Jumat (08:00 - 15:00)" },
  { id: "loc-2", name: "Bank Sampah Unit Hijau Lestari", address: "Jl. Merdeka Baru No.12, Sektor Utara", lat: -7.265231, lng: 112.753821, phone: "0812-3456-7890", hours: "Senin - Sabtu (09:00 - 14:00)" },
  { id: "loc-3", name: "Bank Sampah Mitra Eco Champion", address: "Jl. Diponegoro No.89, Sektor Selatan", lat: -7.281090, lng: 112.772091, phone: "0855-6677-8899", hours: "Setiap Hari (08:00 - 17:00)" }
];

const DEFAULT_CATEGORIES: EItemCategory[] = [
  { id: "cat-1", name: "Gadget / Handphone", basePrice: 150, description: "Smartphone, Tablet, Smartwatch" },
  { id: "cat-2", name: "Komputer / Laptop", basePrice: 200, description: "Laptop, Notebook, PC Desktop, CPU, Motherboard" },
  { id: "cat-3", name: "Peralatan Rumah Tangga", basePrice: 100, description: "Kulkas, Mesin Cuci, Dispenser, Rice Cooker, Setrika, Kipas Angin" },
  { id: "cat-4", name: "Aksesoris & Kabel", basePrice: 50, description: "Kabel, Adaptor, Charger, Keyboard, Mouse, RAM, Harddisk, SSD" },
  { id: "cat-5", name: "Media Player & TV", basePrice: 120, description: "TV, Monitor, Speaker, CCTV, Kamera, Drone" }
];

const DEFAULT_DAMAGE_LEVELS: DamageLevel[] = [
  { id: "dmg-1", name: "Masih Berfungsi", multiplier: 1.2 },
  { id: "dmg-2", name: "Rusak Ringan", multiplier: 1.0 },
  { id: "dmg-3", name: "Rusak Sedang", multiplier: 0.8 },
  { id: "dmg-4", name: "Rusak Berat", multiplier: 0.6 },
  { id: "dmg-5", name: "Mati Total", multiplier: 0.4 },
  { id: "dmg-6", name: "Tidak Lengkap / Komponen Hilang", multiplier: 0.3 }
];

const DEFAULT_VOUCHERS: Voucher[] = [
  { id: "v-1", title: "PLN Token Listrik Rp20.000", cost: 150, value: 20000, stock: 50, category: "listrik", codePrefix: "PLN20K" },
  { id: "v-2", title: "PLN Token Listrik Rp50.000", cost: 350, value: 50000, stock: 30, category: "listrik", codePrefix: "PLN50K" },
  { id: "v-3", title: "PLN Token Listrik Rp100.000", cost: 680, value: 100000, stock: 15, category: "listrik", codePrefix: "PLN100K" },
  { id: "v-4", title: "PLN Token Listrik Rp200.000", cost: 1300, value: 200000, stock: 8, category: "listrik", codePrefix: "PLN200K" }
];

const DEFAULT_NEWS: Announcement[] = [
  {
    id: "news-1",
    title: "Mengenal Bahaya Sampah Elektronik (E-Waste)",
    content: "E-Waste mengandung zat kimia berbahaya seperti timbal, merkuri, dan kadmium. Jika dibuang sembarangan, racun ini dapat mencemari tanah dan air. Tukarkan e-waste Anda di Bank Sampah DLH terdekat untuk didaur ulang secara aman!",
    date: "2026-07-15",
    author: "Admin DLH",
    category: "edukasi"
  },
  {
    id: "news-2",
    title: "Program Subsidi Voucher Listrik DLH 2026",
    content: "Dinas Lingkungan Hidup meluncurkan program konversi sampah elektronik menjadi voucher listrik prabayar. Kumpulkan poin dari setoran sampah elektronik Anda dan tukarkan langsung di menu Voucher Listrik!",
    date: "2026-07-18",
    author: "Humas DLH",
    category: "pengumuman"
  },
  {
    id: "news-3",
    title: "Cara Menjaga Baterai HP Agar Tidak Cepat Rusak",
    content: "Hindari mengisi baterai semalaman dan usahakan menjaga baterai di rentang 20% - 80%. Ini memperpanjang umur baterai lithium-ion dan mengurangi volume sampah elektronik baterai.",
    date: "2026-07-19",
    author: "E-Waste Specialist",
    category: "edukasi"
  }
];

const DEFAULT_USERS: UserProfile[] = [
  {
    uid: "admin-uid",
    email: "admin@ewaste.com",
    fullName: "Budi Hartono (Admin DLH)",
    role: "admin",
    points: 0,
    carbonReduced: 0,
    badges: ["DLH Pioneer"],
    createdAt: "2026-07-01T00:00:00Z"
  },
  {
    uid: "officer-uid",
    email: "petugas@ewaste.com",
    fullName: "Agus Saputra (Petugas DLH)",
    role: "petugas",
    points: 0,
    carbonReduced: 0,
    badges: [],
    createdAt: "2026-07-01T00:00:00Z",
    locationId: "loc-1",
    locationName: "Bank Sampah Induk DLH Kota"
  },
  {
    uid: "officer-uid-2",
    email: "petugas2@ewaste.com",
    fullName: "Siti Aminah (Petugas Unit Lestari)",
    role: "petugas",
    points: 0,
    carbonReduced: 0,
    badges: [],
    createdAt: "2026-07-01T00:00:00Z",
    locationId: "loc-2",
    locationName: "Bank Sampah Unit Lestari"
  },
  {
    uid: "user-uid",
    email: "user@ewaste.com",
    fullName: "Rian Wijaya (Eco Hero)",
    role: "user",
    points: 480,
    carbonReduced: 25.4,
    badges: ["Green Champion", "Eco Hero"],
    phoneNumber: "0812-3456-7890",
    address: "Jl. Kenanga Indah No.23, Kota",
    createdAt: "2026-07-02T10:00:00Z"
  },
  {
    uid: "user-dewi",
    email: "dewi@ewaste.com",
    fullName: "Dewi Lestari",
    role: "user",
    points: 120,
    carbonReduced: 6.8,
    badges: ["Eco Starter"],
    phoneNumber: "0813-9876-5432",
    address: "Jl. Melati Harum No.89, Kota",
    createdAt: "2026-07-03T11:00:00Z"
  },
  {
    uid: "user-bambang",
    email: "bambang@ewaste.com",
    fullName: "Bambang Pratama",
    role: "user",
    points: 80,
    carbonReduced: 4.2,
    badges: [],
    phoneNumber: "0857-4433-2211",
    address: "Jl. Dahlia Baru No.12, Kota",
    createdAt: "2026-07-04T12:00:00Z"
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1001",
    date: "2026-07-10T14:32:00Z",
    officerId: "officer-uid",
    officerName: "Agus Saputra (Petugas DLH)",
    userId: "user-uid",
    userName: "Rian Wijaya (Eco Hero)",
    itemType: "Laptop",
    brand: "Asus",
    category: "Komputer / Laptop",
    weight: 2.1,
    damageLevel: "Rusak Sedang",
    damageMultiplier: 0.8,
    points: 336, // 200 * 2.1 * 0.8
    photoUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    status: "approved",
    carbonSaved: 16.8, // 8kg per kg laptop
    notes: "Layar pecah, RAM & HDD masih ada."
  },
  {
    id: "tx-1002",
    date: "2026-07-15T09:15:00Z",
    officerId: "officer-uid",
    officerName: "Agus Saputra (Petugas DLH)",
    userId: "user-uid",
    userName: "Rian Wijaya (Eco Hero)",
    itemType: "Smartphone",
    brand: "Samsung",
    category: "Gadget / Handphone",
    weight: 0.25,
    damageLevel: "Mati Total",
    damageMultiplier: 0.4,
    points: 15, // 150 * 0.25 * 0.4
    photoUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    status: "approved",
    carbonSaved: 1.2,
    notes: "Baterai kembung, layar tidak bisa menyala."
  },
  {
    id: "tx-1003",
    date: "2026-07-18T11:20:00Z",
    officerId: "officer-uid",
    officerName: "Agus Saputra (Petugas DLH)",
    userId: "user-uid",
    userName: "Rian Wijaya (Eco Hero)",
    itemType: "Keyboard",
    brand: "Logitech",
    category: "Aksesoris & Kabel",
    weight: 0.8,
    damageLevel: "Masih Berfungsi",
    damageMultiplier: 1.2,
    points: 48, // 50 * 0.8 * 1.2
    photoUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    status: "approved",
    carbonSaved: 0.8,
    notes: "Tombol lengkap, terawat."
  }
];

const DEFAULT_REDEEMS = [
  {
    id: "red-1",
    userId: "user-uid",
    userName: "Rian Wijaya (Eco Hero)",
    voucherId: "v-1",
    voucherTitle: "PLN Token Listrik Rp20.000",
    cost: 150,
    code: "PLN20K-8921-3948-2839",
    date: "2026-07-12T16:00:00Z"
  }
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: "b-1",
    userId: "user-uid",
    userName: "Rian Wijaya (Eco Hero)",
    locationId: "loc-1",
    locationName: "Bank Sampah Induk DLH Kota",
    date: "2026-07-22",
    timeSlot: "10:00 - 12:00",
    itemPreview: "Kipas Cosmos Rusak",
    status: "scheduled",
    itemName: "Kipas Angin",
    brand: "Cosmos",
    condition: "Rusak Ringan",
    userPhotos: [
      "https://images.unsplash.com/photo-1618945032843-224159d5e82b?w=500&auto=format&fit=crop&q=60"
    ],
    userPhotoLabels: ["Tampak Depan"],
    officerPhotos: []
  },
  {
    id: "b-2",
    userId: "user-dewi",
    userName: "Dewi Lestari",
    locationId: "loc-2",
    locationName: "Bank Sampah Unit Lestari",
    date: "2026-07-23",
    timeSlot: "13:00 - 15:00",
    itemPreview: "Laptop Asus Layar Rusak",
    status: "scheduled",
    itemName: "Laptop",
    brand: "Asus",
    condition: "Rusak Sedang",
    userPhotos: [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500"
    ],
    userPhotoLabels: ["Tampak Atas"],
    officerPhotos: []
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "2026-07-02T10:00:00Z",
    userId: "user-uid",
    userName: "Rian Wijaya",
    userRole: "user",
    action: "Register",
    details: "Pendaftaran akun baru di sistem."
  },
  {
    id: "log-2",
    timestamp: "2026-07-10T14:32:00Z",
    userId: "officer-uid",
    userName: "Agus Saputra",
    userRole: "petugas",
    action: "Input Transaksi",
    details: "Mencatat setoran e-waste Laptop Asus dari Rian Wijaya (tx-1001)."
  },
  {
    id: "log-3",
    timestamp: "2026-07-12T16:00:00Z",
    userId: "user-uid",
    userName: "Rian Wijaya",
    userRole: "user",
    action: "Penukaran Voucher",
    details: "Menukarkan 150 poin dengan PLN Token Rp20.000."
  }
];

// Initialize Storage Helper
function getStorage<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// -------------------------------------------------------------
// LOCAL STATE STORAGE ENGINE
// -------------------------------------------------------------
export class EStore {
  static getLocations = () => getStorage<WasteBankLocation[]>("ew_locations", DEFAULT_LOCATIONS);
  static saveLocations = (data: WasteBankLocation[]) => setStorage("ew_locations", data);

  static getCategories = () => getStorage<EItemCategory[]>("ew_categories", DEFAULT_CATEGORIES);
  static saveCategories = (data: EItemCategory[]) => setStorage("ew_categories", data);

  static getDamageLevels = () => getStorage<DamageLevel[]>("ew_damage_levels", DEFAULT_DAMAGE_LEVELS);
  static saveDamageLevels = (data: DamageLevel[]) => setStorage("ew_damage_levels", data);

  static getVouchers = () => getStorage<Voucher[]>("ew_vouchers", DEFAULT_VOUCHERS);
  static saveVouchers = (data: Voucher[]) => setStorage("ew_vouchers", data);

  static getNews = () => getStorage<Announcement[]>("ew_news", DEFAULT_NEWS);
  static saveNews = (data: Announcement[]) => setStorage("ew_news", data);

  static getUsers = () => getStorage<UserProfile[]>("ew_users", DEFAULT_USERS);
  static saveUsers = (data: UserProfile[]) => setStorage("ew_users", data);

  static getTransactions = () => getStorage<Transaction[]>("ew_transactions", DEFAULT_TRANSACTIONS);
  static saveTransactions = (data: Transaction[]) => setStorage("ew_transactions", data);

  static getRedeems = () => getStorage<any[]>("ew_redeems", DEFAULT_REDEEMS);
  static saveRedeems = (data: any[]) => setStorage("ew_redeems", data);

  static getBookings = () => getStorage<Booking[]>("ew_bookings", DEFAULT_BOOKINGS);
  static saveBookings = (data: Booking[]) => setStorage("ew_bookings", data);

  static getAuditLogs = () => getStorage<AuditLog[]>("ew_audit_logs", DEFAULT_AUDIT_LOGS);
  static saveAuditLogs = (data: AuditLog[]) => setStorage("ew_audit_logs", data);
}

// -------------------------------------------------------------
// FIREBASE FIRESTORE ADAPTER (with offline-fallback & localStorage syncing)
// -------------------------------------------------------------
export const dbService = {
  // REALTIME SUBSCRIPTIONS
  subscribeUsers: (callback: (users: UserProfile[]) => void) => {
    return onSnapshot(collection(db, "users"), (snap) => {
      const users: UserProfile[] = [];
      snap.forEach((doc) => users.push(doc.data() as UserProfile));
      const localUsers = EStore.getUsers();
      const mergedMap = new Map();
      localUsers.forEach(u => mergedMap.set(u.uid, u));
      users.forEach(u => mergedMap.set(u.uid, u));
      const finalUsers = Array.from(mergedMap.values());
      EStore.saveUsers(finalUsers);
      callback(finalUsers);
    }, (error) => {
      console.warn("Subscribe users error:", error);
      callback(EStore.getUsers());
    });
  },

  subscribeTransactions: (callback: (txs: Transaction[]) => void) => {
    return onSnapshot(collection(db, "transactions"), (snap) => {
      const txs: Transaction[] = [];
      snap.forEach((doc) => txs.push(doc.data() as Transaction));
      const localTxs = EStore.getTransactions();
      const mergedMap = new Map();
      localTxs.forEach(t => mergedMap.set(t.id, t));
      txs.forEach(t => mergedMap.set(t.id, t));
      const finalTxs = Array.from(mergedMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      EStore.saveTransactions(finalTxs);
      callback(finalTxs);
    }, (error) => {
      console.warn("Subscribe transactions error:", error);
      callback(EStore.getTransactions());
    });
  },

  subscribeBookings: (callback: (bookings: Booking[]) => void) => {
    return onSnapshot(collection(db, "bookings"), (snap) => {
      const list: Booking[] = [];
      snap.forEach((doc) => list.push(doc.data() as Booking));
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        EStore.saveBookings(list);
        callback(list);
      } else {
        const local = EStore.getBookings();
        local.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(local);
      }
    }, (error) => {
      console.warn("Subscribe bookings error:", error);
      const local = EStore.getBookings();
      local.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(local);
    });
  },

  subscribeAnnouncements: (callback: (news: Announcement[]) => void) => {
    return onSnapshot(collection(db, "announcements"), (snap) => {
      const list: Announcement[] = [];
      snap.forEach((doc) => list.push(doc.data() as Announcement));
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        EStore.saveNews(list);
        callback(list);
      } else {
        const local = EStore.getNews();
        local.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(local);
      }
    }, (error) => {
      console.warn("Subscribe announcements error:", error);
      const local = EStore.getNews();
      local.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(local);
    });
  },

  // AUDIT LOGGING
  addAuditLog: async (userId: string, userName: string, role: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole: role,
      action,
      details
    };
    const logs = EStore.getAuditLogs();
    logs.unshift(newLog);
    EStore.saveAuditLogs(logs);

    try {
      await addDoc(collection(db, "audit_logs"), {
        ...newLog,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore audit_log add failed. Saved to local storage.", e);
    }
  },

  // USERS
  getUsers: async (): Promise<UserProfile[]> => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const users: UserProfile[] = [];
      snap.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });
      const localUsers = EStore.getUsers();
      const mergedMap = new Map();
      localUsers.forEach(u => mergedMap.set(u.uid, u));
      users.forEach(u => mergedMap.set(u.uid, u));
      const finalUsers = Array.from(mergedMap.values());
      EStore.saveUsers(finalUsers);
      return finalUsers;
    } catch (e) {
      console.warn("Firestore users fetch failed. Falling back to local storage.", e);
    }
    return EStore.getUsers();
  },

  updateUserProfile: async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    const users = EStore.getUsers();
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data } as UserProfile;
      EStore.saveUsers(users);
    }
    try {
      await updateDoc(doc(db, "users", uid), data);
    } catch (e) {
      console.warn("Firestore user profile update failed. Saved to local storage.", e);
    }
  },

  // TRANSACTIONS
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const snap = await getDocs(collection(db, "transactions"));
      const txs: Transaction[] = [];
      snap.forEach((doc) => {
        txs.push(doc.data() as Transaction);
      });
      const localTxs = EStore.getTransactions();
      const mergedMap = new Map();
      localTxs.forEach(t => mergedMap.set(t.id, t));
      txs.forEach(t => mergedMap.set(t.id, t));
      const finalTxs = Array.from(mergedMap.values());
      finalTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      EStore.saveTransactions(finalTxs);
      return finalTxs;
    } catch (e) {
      console.warn("Firestore transactions fetch failed. Falling back to local storage.", e);
    }
    const txs = EStore.getTransactions();
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return txs;
  },

  /**
   * REFACTORED: Calls a Cloud Function to process the transaction securely.
   * The function will handle user point updates and transaction creation.
   */
  createTransaction: async (txData: Omit<Transaction, "id" | "date" | "status">): Promise<Transaction> => {
    try {
      const processTransaction = httpsCallable(functions, 'processTransaction');
      const result = await processTransaction(txData);
      const newTx = result.data as Transaction;

      // --- Update local state AFTER successful server operation ---
      // Update user in local storage
      const users = EStore.getUsers();
      const userIdx = users.findIndex(u => u.uid === newTx.userId);
      if (userIdx !== -1) {
        users[userIdx].points = (users[userIdx].points || 0) + newTx.points;
        users[userIdx].carbonReduced = (users[userIdx].carbonReduced || 0) + newTx.carbonSaved;
        EStore.saveUsers(users);
      }

      // Add transaction to local storage
      const transactions = EStore.getTransactions();
      transactions.unshift(newTx);
      EStore.saveTransactions(transactions);

      return newTx;
    } catch (error) {
      console.error("Cloud Function 'processTransaction' failed:", error);
      throw new Error("Gagal memproses transaksi di server. Silakan coba lagi.");
    }
  },

  // VOUCHERS & REDEMPTIONS
  getVouchers: async (): Promise<Voucher[]> => {
    try {
      const snap = await getDocs(collection(db, "vouchers"));
      const list: Voucher[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Voucher);
      });
      if (list.length > 0) {
        EStore.saveVouchers(list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore vouchers fetch failed. Using local storage.", e);
    }
    return EStore.getVouchers();
  },

  redeemVoucher: async (userId: string, userName: string, voucherId: string): Promise<{ success: boolean; code?: string; message?: string }> => {
    const vouchers = EStore.getVouchers();
    const vIdx = vouchers.findIndex((v) => v.id === voucherId);
    if (vIdx === -1) return { success: false, message: "Voucher tidak ditemukan." };

    const voucher = vouchers[vIdx];
    if (voucher.stock <= 0) return { success: false, message: "Stok voucher habis." };

    const users = EStore.getUsers();
    const uIdx = users.findIndex((u) => u.uid === userId);
    if (uIdx === -1) return { success: false, message: "User tidak ditemukan." };

    const user = users[uIdx];
    if (user.points < voucher.cost) return { success: false, message: "Poin tidak mencukupi." };

    // Deduct points & stock locally
    user.points -= voucher.cost;
    voucher.stock -= 1;
    EStore.saveUsers(users);
    EStore.saveVouchers(vouchers);

    // Generate Token Code
    const randomToken = Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000);
    const code = `${voucher.codePrefix}-${randomToken}`;

    // Log Redemption locally
    const redeems = EStore.getRedeems();
    const newRedemption = {
      id: `red-${Date.now()}`,
      userId,
      userName,
      voucherId,
      voucherTitle: voucher.title,
      cost: voucher.cost,
      code,
      date: new Date().toISOString()
    };
    redeems.unshift(newRedemption);
    EStore.saveRedeems(redeems);

    // Firestore updates
    try {
      await updateDoc(doc(db, "users", userId), { points: user.points });
      await updateDoc(doc(db, "vouchers", voucherId), { stock: voucher.stock });
      await setDoc(doc(db, "redeems", newRedemption.id), newRedemption);
    } catch (e) {
      console.warn("Firestore redemption sync failed. Updated locally.", e);
    }

    // Add Audit Log
    await dbService.addAuditLog(userId, userName, "user", "Penukaran Voucher", `Menukarkan ${voucher.cost} poin dengan ${voucher.title}. Kode token: ${code}.`);

    return { success: true, code };
  },

  getRedeems: async (): Promise<any[]> => {
    try {
      const snap = await getDocs(collection(db, "redeems"));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push(doc.data());
      });
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        EStore.saveRedeems(list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore redeems fetch failed. Using local storage.", e);
    }
    const list = EStore.getRedeems();
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  // BOOKINGPENYETORAN
  getBookings: async (): Promise<Booking[]> => {
    try {
      const snap = await getDocs(collection(db, "bookings"));
      const list: Booking[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Booking);
      });
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        EStore.saveBookings(list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore bookings fetch failed. Using local storage.", e);
    }
    const list = EStore.getBookings();
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  createBooking: async (booking: Omit<Booking, "id" | "status">): Promise<Booking> => {
    const newBooking: Booking = {
      ...booking,
      id: `b-${Date.now()}`,
      status: "scheduled",
      officerPhotos: []
    };

    const bookings = EStore.getBookings();
    bookings.unshift(newBooking);
    EStore.saveBookings(bookings);

    try {
      await setDoc(doc(db, "bookings", newBooking.id), newBooking);
    } catch (e) {
      console.warn("Firestore save booking failed.", e);
      throw new Error("Gagal menyimpan ke database. Pastikan koneksi internet stabil.");
    }

    // Add Audit Log
    await dbService.addAuditLog(booking.userId, booking.userName, "user", "Booking Penyetoran", `Membuat jadwal penyetoran e-waste pada ${booking.date} (${booking.timeSlot}) di ${booking.locationName}.`);

    return newBooking;
  },

  completeBookingCheckin: async (
    bookingId: string,
    officerPhotos: string[],
    weightReceived: number,
    // manualPoints: number | null, // This was the error, it's not needed here
    pointsAwarded: number,
    carbonSaved: number,
    officerId: string,
    officerName: string
  ): Promise<Booking | null> => {
    const bookings = EStore.getBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) return null;

    const booking = bookings[idx];
    booking.status = "completed";
    booking.officerPhotos = officerPhotos;
    booking.weightReceived = weightReceived;
    booking.pointsAwarded = pointsAwarded;

    // Dapatkan kategori dan damage multiplier yang benar untuk log transaksi
    const categories = EStore.getCategories();
    const damageLevels = EStore.getDamageLevels();
    const matchedCategory = categories.find(c => booking.itemName?.toLowerCase().includes(c.name.split(" / ")[0].toLowerCase())) || categories[0];
    const matchedDamage = damageLevels.find(d => d.name === booking.condition) || damageLevels[2]; // Default ke Rusak Sedang
    const photoUrl = officerPhotos[0] || booking.userPhotos?.[0] || "";

    // Create a transaction record linked to this checkin
    await dbService.createTransaction({
      officerId,
      officerName,
      userId: booking.userId,
      userName: booking.userName,
      itemType: booking.itemName || "E-Waste",
      brand: booking.brand || "Generik",
      category: matchedCategory.name,
      weight: weightReceived,
      damageLevel: booking.condition || "Rusak Sedang",
      damageMultiplier: matchedDamage.multiplier,
      points: pointsAwarded,
      photoUrl: photoUrl,
      carbonSaved,
      notes: `Penerimaan dari Booking ${bookingId}`
    });

    EStore.saveBookings(bookings);

    return booking;
  },


  // ANNOUNCEMENTS & NEWS
  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const snap = await getDocs(collection(db, "news"));
      const list: Announcement[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Announcement);
      });
      if (list.length > 0) {
        EStore.saveNews(list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore news fetch failed. Using local storage.", e);
    }
    return EStore.getNews();
  },

  // LOCATIONS
  getLocations: async (): Promise<WasteBankLocation[]> => {
    try {
      const snap = await getDocs(collection(db, "locations"));
      const list: WasteBankLocation[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as WasteBankLocation);
      });
      if (list.length > 0) {
        EStore.saveLocations(list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore locations fetch failed. Using local storage.", e);
    }
    return EStore.getLocations();
  }
};

// Immediate initializer for demo database seeding
(() => {
  if (typeof window !== "undefined") {
    if (!localStorage.getItem("ew_users")) {
      localStorage.setItem("ew_users", JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem("ew_locations")) {
      localStorage.setItem("ew_locations", JSON.stringify(DEFAULT_LOCATIONS));
    }
    if (!localStorage.getItem("ew_transactions")) {
      localStorage.setItem("ew_transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
    }
    if (!localStorage.getItem("ew_redeems")) {
      localStorage.setItem("ew_redeems", JSON.stringify(DEFAULT_REDEEMS));
    }
    if (!localStorage.getItem("ew_bookings")) {
      localStorage.setItem("ew_bookings", JSON.stringify(DEFAULT_BOOKINGS));
    }
    if (!localStorage.getItem("ew_news")) {
      localStorage.setItem("ew_news", JSON.stringify(DEFAULT_NEWS));
    }
    if (!localStorage.getItem("ew_audit_logs")) {
      localStorage.setItem("ew_audit_logs", JSON.stringify(DEFAULT_AUDIT_LOGS));
    }
  }
})();
