import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "../config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Fungsi untuk membuat dokumen pengguna di Firestore.
 * Dipindahkan ke sini untuk menghindari impor dari file .jsx yang bermasalah.
 * @param {object} user - Objek pengguna dari Firebase Auth.
 * @param {object} additionalData - Data tambahan dari form atau profil Google.
 */
export const createUserDocument = async (user: FirebaseUser, additionalData: any = {}) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);

  const userData = {
    uid: user.uid,
    email: user.email,
    fullName: additionalData.fullName || user.displayName || "Pengguna Baru",
    phone: additionalData.phone || user.phoneNumber || "",
    address: additionalData.address || {},
    role: "user",
    status: "active",
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, userData);
};

type Role = "admin" | "petugas" | "user";

type UserProfile = {
  uid: string;
  email: string | null;
  fullName: string;
  role: Role;
  points: number;
  photoProfile?: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: any;
};

type AuthContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phoneNumber?: string, address?: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>; // Tambahkan fungsi ini
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (user: FirebaseUser | null) => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      // Selalu coba ambil data terbaru dari Firestore
      const profileDoc = await getDoc(doc(db, "users", user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const prof: UserProfile = {
          uid: user.uid,
          email: user.email,
          fullName: data.fullName || "Pengguna",
          role: (data.role as Role) || "user",
          points: data.points ?? 0,
          photoProfile: data.photoProfile || "",
          createdAt: data.createdAt,
        };
        setProfile(prof);
        sessionStorage.setItem("ew_session_profile", JSON.stringify(prof));
        return;
      }
    } catch (e) {
      console.warn("Firestore fetch error, trying to use session cache.", e);
    }
    
    // Fallback to session cache if Firestore fails or document doesn't exist yet
    const cached = sessionStorage.getItem("ew_session_profile");
    if (cached) {
      setProfile(JSON.parse(cached));
      return;
    }
    console.warn(`Profile for ${user.uid} not found in Firestore and no cache available yet.`);
  };

  useEffect(() => {
    // Set Firebase Auth to session-only persistence so different tabs can have different accounts
    setPersistence(auth, browserSessionPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          await user.getIdToken(true);
        } catch (e) {
          console.warn("Unable to refresh auth token during startup:", e);
        }
        await loadUserProfile(user);
      } else {
        const cached = sessionStorage.getItem("ew_session_profile");
        if (cached) {
          try {
            setProfile(JSON.parse(cached));
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Refresh token so any custom claims are available immediately
      await user.getIdToken(true);

      // Cek apakah pengguna sudah ada di database
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      // Jika tidak ada, buat dokumen pengguna baru
      if (!userDoc.exists()) {
        console.log(`Creating new user document for ${user.displayName}`);
        await createUserDocument(user); // Gunakan fungsi yang sudah diekspor
      }

      // Muat profil pengguna setelah login atau registrasi berhasil
      await loadUserProfile(result.user);
    } catch (err) {
      console.error("Google login failed:", err);
      throw err; // Lemparkan error agar bisa ditangani di halaman login
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await result.user.getIdToken(true);
      await loadUserProfile(result.user);
    } catch (firebaseErr: any) {
      console.warn("Firebase Auth login failed:", firebaseErr);
      // Melempar error dengan kode aslinya agar dapat dibedakan di UI
      throw firebaseErr; 
    }
  };

  const register = async (email: string, password: string, fullName: string, phoneNumber?: string, address?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newDoc = {
        uid: result.user.uid,
        email,
        fullName,
        phoneNumber: phoneNumber || "",
        address: address || "",
        role: "user" as Role,
        points: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", result.user.uid), newDoc);
      
      // Delay sedikit agar onAuthStateChanged selesai sebelum loadUserProfile 
      // yang dipanggil oleh register.
      await new Promise(res => setTimeout(res, 500));
      await loadUserProfile(result.user);
    } catch (firebaseErr) {
      console.warn("Firebase Auth register failed:", firebaseErr);
      throw firebaseErr;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out of Firebase Auth failed.");
    }
    sessionStorage.removeItem("ew_session_profile");
    setProfile(null);
  };

  const reloadProfile = async () => {
    if (auth.currentUser) {
      console.log("Reloading user profile from Firestore...");
      await loadUserProfile(auth.currentUser);
    }
  };

  const value = useMemo(
    () => ({ profile, loading, loginWithGoogle, loginWithEmail, register, logout, reloadProfile }),
    [profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
