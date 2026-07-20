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

        // 1. Dapatkan data awal yang disimpan oleh klien saat registrasi
        const userDocRef = db.collection("users").doc(uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            console.log(`Dokumen untuk user ${uid} tidak ditemukan. Mungkin dibuat oleh admin.`);
            return null;
        }
        const userData = userDoc.data();

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

        // 4. Set Custom Claims untuk Role-Based Access Control
        await admin.auth().setCustomUserClaims(uid, { role: "user" });

        // 5. Update dokumen pengguna dengan data baru DAN role dari custom claim
        await userDocRef.update({ ...additionalData, role: "user" });

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
        let userRole = token.role;
        const userRef = db.collection("users").doc(uid);

        if (!userRole) {
            const currentUserDoc = await userRef.get();
            if (currentUserDoc.exists) {
                userRole = currentUserDoc.data().role;
            }
        }

        if (userRole !== "admin" && userRole !== "petugas") {
            throw new functions.https.HttpsError("permission-denied", "Anda tidak memiliki izin untuk melakukan aksi ini.");
        }

        // 2. Validasi data input
        const { userId, points, carbonSaved } = data;
        if (!userId || typeof points !== "number" || typeof carbonSaved !== "number") {
            throw new functions.https.HttpsError("invalid-argument", "Data yang dikirim tidak lengkap atau tidak valid.");
        }

        const transactionId = `tx-${Date.now()}`;
        const newTxData = {
            ...data,
            id: transactionId,
            date: new Date().toISOString(),
            status: "approved",
            officerId: uid, // Officer ID diambil dari konteks auth yang aman
        };

        const userRef = db.collection("users").doc(userId);
        const transactionRef = db.collection("transactions").doc(transactionId);
        const auditLogRef = db.collection("audit_logs").doc();

        try {
            // 3. Jalankan operasi dalam satu transaction batch
            await db.runTransaction(async (t) => {
                const userDoc = await t.get(userRef);
                if (!userDoc.exists) {
                    throw new functions.https.HttpsError("not-found", `Pengguna dengan ID ${userId} tidak ditemukan.`);
                }

                const newPoints = (userDoc.data().points || 0) + points;
                const newCarbonReduced = (userDoc.data().carbonReduced || 0) + carbonSaved;

                t.update(userRef, { points: newPoints, carbonReduced: newCarbonReduced });
                t.set(transactionRef, newTxData);
                t.set(auditLogRef, { action: "Input Transaksi", details: `Mencatat setoran e-waste ${data.itemType} untuk user ${data.userName}.`, timestamp: admin.firestore.FieldValue.serverTimestamp(), userId: uid, userName: data.officerName, userRole });
            });

            return newTxData; // Kirim kembali data transaksi yang berhasil dibuat
        } catch (error) {
            console.error("Gagal menjalankan transaction batch:", error);
            throw new functions.https.HttpsError("internal", "Terjadi kesalahan di server saat memproses transaksi.", error.message);
        }
    });