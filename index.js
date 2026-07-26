const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Terpicu setiap kali ada pengguna baru dibuat di Firebase Authentication.
 * Fungsi ini akan melengkapi profil pengguna di Firestore.
 */
exports.onUserCreate = functions.region("asia-southeast2")
    .auth.user().onCreate(async (user) => {
        const { uid } = user;

        // 1. Dapatkan dokumen pengguna di Firestore. Jika tidak ada, buat dengan data default.
        const userDocRef = db.collection("users").doc(uid);
        const userDoc = await userDocRef.get();
        let userData = {};
        if (userDoc.exists) {
            userData = userDoc.data();
        } else {
            console.log(`Dokumen Firestore untuk user ${uid} tidak ditemukan. Membuat dokumen baru.`);
            // Data default jika dokumen belum ada (misal: user dibuat via Firebase Auth console atau email/password)
            userData = { uid: uid, email: user.email, fullName: user.displayName || "Pengguna Baru", createdAt: admin.firestore.FieldValue.serverTimestamp() };
        }

        // 2. Generate Member ID Unik menggunakan counter
        const counterRef = db.collection("settings").doc("userCounter");
        const newIdNumber = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let nextId = 1;
            if (counterDoc.exists) {
                nextId = counterDoc.data().currentNumber + 1;
            }
            transaction.set(counterRef, { currentNumber: nextId }, { merge: true });
            return nextId;
        });

        const year = new Date().getFullYear();
        const memberId = `USR-${year}-${String(newIdNumber).padStart(6, "0")}`;

        // 3. Siapkan data tambahan untuk profil pengguna
        const additionalData = {
            memberId: memberId,
            points: 0,
            totalWeight: 0,
            totalTransactions: 0,
            photoProfile: user.photoURL || "",
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${memberId}`,
            emailVerified: user.emailVerified,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 4. Set Custom Claims untuk Role-Based Access Control (default ke 'user' untuk pengguna baru)
        await admin.auth().setCustomUserClaims(uid, { role: "user" });

        // 5. Set/Update dokumen pengguna di Firestore dengan data baru DAN role dari custom claim
        await userDocRef.set({ ...userData, ...additionalData, role: "user" }, { merge: true });

        console.log(`Profil lengkap untuk user ${uid} berhasil dibuat dengan memberId: ${memberId}`);
        return null;
    });

/**
 * HTTPS Callable Function untuk memproses transaksi penyetoran e-waste.
 * Hanya bisa dipanggil oleh 'petugas' atau 'admin'.
 * Secara atomik akan membuat dokumen transaksi dan memperbarui poin pengguna.
 */
exports.processTransaction = functions.region("asia-southeast2")
    .https.onCall(async (data, context) => {
        // 1. Verifikasi otentikasi dan peran (role)
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Request tidak terautentikasi.");
        }

        const { uid, token } = context.auth;
        const userRole = token.role; // Mengandalkan custom claim yang sudah di-set

        if (userRole !== "admin") { // Hanya admin yang bisa memproses transaksi
            throw new functions.https.HttpsError("permission-denied", "Anda tidak memiliki izin untuk melakukan aksi ini.");
        }

        // 2. Validasi data input
        const { userId, points, carbonSaved } = data; // officerName akan diambil dari server
        if (!userId || typeof points !== "number" || typeof carbonSaved !== "number") {
            throw new functions.https.HttpsError("invalid-argument", "Data yang dikirim tidak lengkap atau tidak valid.");
        }

        const transactionId = `tx-${Date.now()}`;
        const newTxData = {
            ...data,
            // Override officerId dan officerName dengan data dari server untuk keamanan
            officerId: uid,
            officerName: "", // Akan diisi dari userDoc petugas
            id: transactionId,
            date: new Date().toISOString(),
            status: "approved",
        };

        const userRef = db.collection("users").doc(userId);
        const transactionRef = db.collection("transactions").doc(transactionId);
        const auditLogRef = db.collection("audit_logs").doc();
        const officerRef = db.collection("users").doc(uid); // Referensi ke dokumen petugas yang sedang login

        // 3. Jalankan operasi dalam satu transaction batch
        try {
            await db.runTransaction(async (t) => {
                const userDoc = await t.get(userRef);
                if (!userDoc.exists) {
                    throw new functions.https.HttpsError("not-found", `Pengguna dengan ID ${userId} tidak ditemukan.`);
                }
                const officerDoc = await t.get(officerRef);
                if (!officerDoc.exists) {
                    throw new functions.https.HttpsError("not-found", `Profil petugas dengan ID ${uid} tidak ditemukan.`);
                }

                // Ambil nama petugas dari dokumen Firestore untuk keamanan
                newTxData.officerName = officerDoc.data().fullName || "Admin DLH";

                const userData = userDoc.data();
                let memberId = userData.memberId;

                // --- LOGIKA CERDAS: Jika memberId belum ada, buat sekarang! ---
                if (!memberId) {
                    console.log(`Member ID untuk user ${userId} tidak ditemukan. Membuat yang baru...`);
                    const counterRef = db.collection("settings").doc("userCounter");
                    const counterDoc = await t.get(counterRef);
                    let nextId = (counterDoc.data()?.currentNumber || 0) + 1;

                    const year = new Date().getFullYear();
                    memberId = `USR-${year}-${String(nextId).padStart(6, "0")}`;

                    // Update counter dan user document dalam transaksi yang sama
                    t.set(counterRef, { currentNumber: nextId }, { merge: true });
                    t.update(userRef, { memberId: memberId });
                    console.log(`Member ID baru ${memberId} dibuat untuk user ${userId}.`);
                }

                // Lanjutkan dengan update poin dan data lainnya
                const newPoints = (userData.points || 0) + points;
                const newCarbonReduced = (userData.carbonReduced || 0) + carbonSaved;
                const newTotalTransactions = (userData.totalTransactions || 0) + 1;
                const newTotalWeight = (userData.totalWeight || 0) + (data.weight || 0);

                t.update(userRef, { points: newPoints, carbonReduced: newCarbonReduced, totalTransactions: newTotalTransactions, totalWeight: newTotalWeight });
                t.set(transactionRef, newTxData);
                t.set(auditLogRef, { action: "Input Transaksi", details: `Mencatat setoran e-waste ${data.itemType} untuk user ${userData.fullName}.`, timestamp: admin.firestore.FieldValue.serverTimestamp(), userId: uid, userName: newTxData.officerName, userRole: userRole });
            });

            console.log(`Transaksi ${transactionId} berhasil diproses untuk user ${userId}.`);
            return newTxData; // Kirim kembali data transaksi yang berhasil dibuat
        } catch (error) {
            console.error("Gagal menjalankan transaction batch:", error);
            throw new functions.https.HttpsError("internal", "Terjadi kesalahan di server saat memproses transaksi.", error.message);
        }
    });