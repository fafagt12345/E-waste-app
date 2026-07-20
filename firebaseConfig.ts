/**
 * File ini mengimpor konfigurasi Firebase dari environment variables (import.meta.env)
 * dan mengekspornya sebagai satu objek konfigurasi.
 * 
 * Ini juga melakukan validasi untuk memastikan semua variabel yang diperlukan tersedia saat aplikasi berjalan.
 */

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validasi untuk memastikan tidak ada variabel yang kosong/undefined
Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
        throw new Error(`Missing Firebase config key in .env: ${key}`);
    }
});

export default firebaseConfig;