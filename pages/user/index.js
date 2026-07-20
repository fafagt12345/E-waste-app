const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
const { DiscussServiceClient } = require("@google-ai/generativelanguage");

admin.initializeApp();
const db = admin.firestore();

// Konfigurasi untuk Gemini API
const MODEL_NAME = "models/gemini-1.5-flash-001";
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const LOCATION = "asia-southeast1"; // Sesuaikan dengan lokasi Anda

const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
});
const client = new DiscussServiceClient({ auth });

/**
 * Terpicu setiap kali ada file baru diupload ke path 'submissions/'.
 * Fungsi ini akan menganalisis gambar menggunakan Gemini API.
 */
exports.analyzeSubmissionImage = functions
    .region("asia-southeast2") // Pastikan region sesuai
    .storage.object()
    .onFinalize(async (object) => {
        const filePath = object.name; // Contoh: 'submissions/SUB_USERID_TIMESTAMP'
        const contentType = object.contentType;
        const bucketName = object.bucket;

        // 1. Filter agar hanya memproses gambar di folder 'submissions/'
        if (!contentType?.startsWith("image/") || !filePath?.startsWith("submissions/")) {
            console.log(`File ${filePath} dilewati.`);
            return null;
        }

        const submissionId = filePath.split("/").pop();
        console.log(`Mulai menganalisis gambar untuk submission ID: ${submissionId}`);

        // 2. Buat prompt yang detail untuk Gemini
        const prompt = `
            Analisis gambar ini dan identifikasi objek utamanya sebagai sampah elektronik.
            Berikan jawaban HANYA dalam format JSON yang valid dengan struktur:
            {
              "itemName": "NAMA_BARANG_TERDETEKSI",
              "category": "KATEGORI_YANG_SESUAI"
            }
            Contoh Kategori: "Televisi", "Laptop & Komputer", "Handphone & Tablet", "Peralatan Dapur", "Lainnya".
            Jika barangnya adalah laptop, berikan nama "Laptop" dan kategori "Laptop & Komputer".
            Jika barangnya adalah kulkas, berikan nama "Kulkas" dan kategori "Peralatan Dapur".
        `;

        // 3. Siapkan data gambar dan panggil Gemini API
        try {
            const imageBytes = (await admin.storage().bucket(bucketName).file(filePath).download())[0].toString("base64");

            const [response] = await client.generateMessage({
                model: `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/${MODEL_NAME}`,
                prompt: {
                    messages: [{ content: prompt }, { image: { mimeType: contentType, imageBytes: imageBytes } }],
                },
            });

            const jsonResponseText = response.candidates[0].content.replace(/```json\n|```/g, "").trim();
            const aiResult = JSON.parse(jsonResponseText);

            // 4. Dapatkan URL gambar yang bisa diakses publik
            const imageUrl = await admin.storage().bucket(bucketName).file(filePath).getSignedUrl({ action: 'read', expires: '03-09-2491' });

            // 5. Update dokumen di Firestore dengan hasil analisis
            const submissionRef = db.collection("submissions").doc(submissionId);
            await submissionRef.update({
                status: "analyzed",
                detectedItemName: aiResult.itemName,
                detectedCategory: aiResult.category,
                imageUrl: imageUrl[0], // URL gambar
                analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Analisis untuk ${submissionId} berhasil. Barang: ${aiResult.itemName}`);
        } catch (error) {
            console.error("Error saat analisis AI:", error);
            await db.collection("submissions").doc(submissionId).update({ status: "analysis_failed" });
        }
        return null;
    });