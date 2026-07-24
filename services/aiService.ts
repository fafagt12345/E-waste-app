// E-Waste AI Vision Simulation and Helper Service

export interface AIVisionResult {
  itemType: string;
  brand: string;
  category: string;
  estimatedCondition: string;
  description: string;
  confidenceScore: number; // percentage (0-100)
}

// List of supported items, brands, and categories to match nicely in simulation
const CATEGORY_MAP: Record<string, string> = {
  "Handphone": "Gadget / Handphone",
  "Smartphone": "Gadget / Handphone",
  "Tablet": "Gadget / Handphone",
  "Laptop": "Komputer / Laptop",
  "CPU": "Komputer / Laptop",
  "Motherboard": "Komputer / Laptop",
  "Monitor": "Media Player & TV",
  "TV": "Media Player & TV",
  "Speaker": "Media Player & TV",
  "Printer": "Komputer / Laptop",
  "Kabel": "Aksesoris & Kabel",
  "Charger": "Aksesoris & Kabel",
  "Adaptor": "Aksesoris & Kabel",
  "Kipas Angin": "Peralatan Rumah Tangga",
  "Kulkas": "Peralatan Rumah Tangga",
  "Setrika": "Peralatan Rumah Tangga",
  "Rice Cooker": "Peralatan Rumah Tangga"
};

const BRANDS = ["Samsung", "Xiaomi", "Oppo", "Vivo", "Apple", "Asus", "Acer", "Lenovo", "HP", "Dell", "Sony", "Panasonic", "Sharp", "LG", "Philips", "Cosmos", "Miyako", "Logitech"];
const CONDITIONS = ["Masih Berfungsi", "Rusak Ringan", "Rusak Sedang", "Rusak Berat", "Mati Total"];

export const aiService = {
  analyzeImage: async (imageFileOrUrl: File | string): Promise<AIVisionResult> => {
    // Determine URL. If it's a file, it means we must upload it to Cloudinary first.
    // However, aiService should ideally receive the already uploaded Cloudinary URL 
    // to pass to our Vercel Serverless Function because Vercel Serverless Function 
    // has strict payload size limits (4MB) and passing base64 from client could exceed it.
    let imageUrl = "";
    if (typeof imageFileOrUrl === "string") {
      imageUrl = imageFileOrUrl;
      if (imageUrl.startsWith("blob:")) {
         throw new Error("Blob URLs cannot be analyzed by the server. Please upload to Cloudinary first.");
      }
    } else {
       throw new Error("aiService expects a Cloudinary URL, not a File object. Please upload the file first.");
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        let errorMsg = "Gagal memproses gambar melalui AI.";
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      return {
        itemType: result.itemType || "E-Waste",
        brand: result.brand || "Generik",
        category: result.category || "Gadget / Handphone",
        estimatedCondition: result.estimatedCondition || "Rusak Sedang",
        description: result.description || "Dianalisis oleh AI",
        confidenceScore: result.confidenceScore || 85
      };
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      throw err;
    }
  },

  /**
   * Helper to scan barcode/serial numbers on electronic devices.
   */
  scanSerialNumber: async (imageFileOrUrl: File | string): Promise<{ success: boolean; serialNumber?: string; modelCode?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const success = Math.random() > 0.2; // 80% success

    return {
      success,
      serialNumber: success ? `SN-${randomSuffix}-DLH` : undefined,
      modelCode: success ? `MOD-E-WASTE-${Math.floor(100 + Math.random() * 900)}` : undefined
    };
  },

  /**
   * Chatbot simulator response based on Indonesian inquiries about E-Waste.
   */
  getChatbotReply: async (message: string): Promise<string> => {
    // Artificial 800ms delay for natural typing feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    const msg = message.toLowerCase();

    if (msg.includes("halo") || msg.includes("hai") || msg.includes("pagi") || msg.includes("siang") || msg.includes("sore")) {
      return "Halo! Saya adalah Asisten Virtual E-Waste Smart Exchange DLH. Ada yang bisa saya bantu terkait penukaran sampah elektronik hari ini?";
    }
    if (msg.includes("siapa") || msg.includes("tau") || msg.includes("tahu") || msg.includes("apa itu")) {
      return "Saya adalah **Asisten AI E-Waste DLH**. Tugas saya adalah membimbing Anda mendaur ulang sampah elektronik (e-waste) dengan aman dan mengubahnya menjadi poin voucher token listrik PLN. Silakan tanyakan seperti 'cara hitung poin', 'lokasi bank sampah', atau 'bahaya e-waste'.";
    }
    if (msg.includes("bahaya") || msg.includes("racun") || msg.includes("dampak buruk") || msg.includes("merkuri") || msg.includes("timbal")) {
      return "Sampah elektronik mengandung bahan berbahaya dan beracun (B3) seperti **timbal, merkuri, kadmium, dan litium**. Jika dibuang ke tempat sampah biasa, zat ini dapat merembes ke air tanah, mencemari tanah, dan memicu penyakit saraf serta pernapasan kronis. Melalui program DLH ini, e-waste dikelola secara aman dan ramah lingkungan!";
    }
    if (msg.includes("poin") || msg.includes("hitung") || msg.includes("rumus")) {
      return "Poin dihitung dengan rumus: **Poin = Nilai Dasar Kategori × Berat (kg) × Faktor Kerusakan**.\n\nContoh: Laptop memiliki nilai dasar 200 poin/kg. Jika beratnya 2 kg dan faktor kerusakannya 0.8 (Rusak Sedang), maka Anda mendapat: 200 × 2 × 0.8 = 320 Poin!";
    }
    if (msg.includes("voucher") || msg.includes("pln") || msg.includes("tukar") || msg.includes("listrik")) {
      return "Anda dapat menukarkan poin yang terkumpul menjadi **Voucher Token Listrik PLN** prabayar. Vouchers yang tersedia:\n- PLN Rp20.000 (150 Poin)\n- PLN Rp50.000 (350 Poin)\n- PLN Rp100.000 (680 Poin)\n- PLN Rp200.000 (1300 Poin)\n\nSilakan tukar langsung melalui menu 'Tukar Voucher' di dashboard Anda.";
    }
    if (msg.includes("lokasi") || msg.includes("bank sampah") || msg.includes("alamat") || msg.includes("peta")) {
      return "Kami memiliki 3 lokasi utama Dinas Lingkungan Hidup:\n1. **Bank Sampah Induk DLH Kota** (Jl. Adisucipto No.45)\n2. **Bank Sampah Unit Lestari** (Jl. Merdeka Baru No.12)\n3. **Bank Sampah Mitra Eco Champion** (Jl. Diponegoro No.89)\n\nAnda dapat melihat lokasi rincinya di peta interaktif pada menu 'Peta Lokasi'.";
    }
    if (msg.includes("syarat") || msg.includes("cara") || msg.includes("setor")) {
      return "Cara menyetor sampah elektronik:\n1. Bawa sampah elektronik Anda ke Bank Sampah DLH terdekat.\n2. Tunjukkan QR Code Anda dari aplikasi ke petugas.\n3. Petugas akan mengambil foto barang untuk dianalisis oleh AI dan ditimbang.\n4. Setelah diverifikasi, poin akan langsung masuk ke akun Anda.";
    }
    if (msg.includes("carbon") || msg.includes("karbon") || msg.includes("dampak") || msg.includes("emisi")) {
      return "Setiap sampah elektronik yang didaur ulang membantu mengurangi emisi karbon CO2! Sebagai contoh, mendaur ulang 1 laptop menghemat sekitar 8-16 kg emisi CO2 dari penambangan bahan mentah baru. Anda bisa memantau total emisi karbon yang berhasil dikurangi langsung di dashboard Anda.";
    }
    if (msg.includes("terima kasih") || msg.includes("thanks") || msg.includes("oke")) {
      return "Sama-sama! Mari kita jaga bumi kita dengan mengelola sampah elektronik (e-waste) secara bijak bersama Dinas Lingkungan Hidup. Eco Hero, Green Champion!";
    }

    return "Maaf, saya belum memahami pertanyaan Anda secara detail. Anda dapat menanyakan tentang 'cara menghitung poin', 'daftar voucher PLN', 'lokasi bank sampah', atau 'bahaya e-waste'.";
  }
};
