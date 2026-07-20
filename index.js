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

        // 4. Update dokumen pengguna dengan data baru
        await userDocRef.update(additionalData);

        // 5. Set Custom Claims untuk Role-Based Access Control
        await admin.auth().setCustomUserClaims(uid, { role: "user" });

        console.log(`Profil lengkap untuk user ${uid} berhasil dibuat dengan memberId: ${memberId}`);
        return null;
    });