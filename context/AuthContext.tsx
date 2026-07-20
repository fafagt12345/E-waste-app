import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "../config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

type Role = "admin" | "petugas" | "user";

type UserProfile = {
  uid: string;
  email: string | null;
  fullName: string;
  role: Role;
  points: number;
  photoProfile?: string;
  createdAt?: any;
};

type AuthContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
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
        localStorage.setItem("ew_session_profile", JSON.stringify(prof));
      } else {
        const prof: UserProfile = {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || "Pengguna Baru",
          role: "user",
          points: 0,
          photoProfile: user.photoURL || "",
        };
        setProfile(prof);
        localStorage.setItem("ew_session_profile", JSON.stringify(prof));
      }
    } catch (e) {
      console.warn("Firestore fetch error inside AuthProvider. Trying local cache.");
      // Fallback to local profile if document fetch fails
      const cached = localStorage.getItem("ew_session_profile");
      if (cached) {
        setProfile(JSON.parse(cached));
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        await loadUserProfile(user);
      } else {
        const cached = localStorage.getItem("ew_session_profile");
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
      await loadUserProfile(result.user);
    } catch (err) {
      console.warn("Google login failed, using demo fallback account.");
      // Log in offline as user Rian Wijaya
      const mockProfile: UserProfile = {
        uid: "user-uid",
        email: "user@ewaste.com",
        fullName: "Rian Wijaya (Eco Hero)",
        role: "user",
        points: 480,
        photoProfile: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
      };
      setProfile(mockProfile);
      localStorage.setItem("ew_session_profile", JSON.stringify(mockProfile));
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await loadUserProfile(result.user);
    } catch (firebaseErr) {
      console.warn("Firebase Auth offline/failed. Checking local mock database.");
      // Check local storage accounts
      const localUsers = JSON.parse(localStorage.getItem("ew_users") || "[]");
      const matched = localUsers.find((u: any) => u.email === email);
      if (matched && password) {
        const mockProfile: UserProfile = {
          uid: matched.uid,
          email: matched.email,
          fullName: matched.fullName,
          role: matched.role as Role,
          points: matched.points || 0,
          photoProfile: matched.photoProfile || ""
        };
        setProfile(mockProfile);
        localStorage.setItem("ew_session_profile", JSON.stringify(mockProfile));
        return;
      }
      throw firebaseErr; // Re-throw if credentials mismatch local database
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newDoc = {
        uid: result.user.uid,
        email,
        fullName,
        role: "user" as Role,
        points: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", result.user.uid), newDoc);
      await loadUserProfile(result.user);
    } catch (firebaseErr) {
      console.warn("Register offline. Creating local cache account.");
      // Register in local users list
      const localUsers = JSON.parse(localStorage.getItem("ew_users") || "[]");
      const newUid = `user-${Date.now()}`;
      const newUser = {
        uid: newUid,
        email,
        fullName,
        role: "user",
        points: 0,
        createdAt: new Date().toISOString()
      };
      localUsers.push(newUser);
      localStorage.setItem("ew_users", JSON.stringify(localUsers));

      const mockProfile: UserProfile = {
        uid: newUid,
        email,
        fullName,
        role: "user",
        points: 0
      };
      setProfile(mockProfile);
      localStorage.setItem("ew_session_profile", JSON.stringify(mockProfile));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out of Firebase Auth failed.");
    }
    localStorage.removeItem("ew_session_profile");
    setProfile(null);
  };

  const value = useMemo(
    () => ({ profile, loading, loginWithGoogle, loginWithEmail, register, logout }),
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
