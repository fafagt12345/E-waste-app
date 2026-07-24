import heic2any from "heic2any";

export const uploadToCloudinary = async (
  file: File | Blob, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  let fileToUpload = file;
  const fileName = file instanceof File ? file.name : "camera_capture.jpg";
  
  // Deteksi HEIC/HEIF
  if (
    file.type === "image/heic" || 
    file.type === "image/heif" || 
    fileName.toLowerCase().endsWith(".heic") || 
    fileName.toLowerCase().endsWith(".heif")
  ) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8
      });
      // heic2any can return Blob or Blob[]
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      fileToUpload = new File([blob], fileName.replace(/\.hei[cf]$/i, ".jpg"), { type: "image/jpeg" });
    } catch (err) {
      console.warn("Failed to convert HEIC image", err);
      throw new Error("Gagal mengkonversi format foto (HEIC/HEIF).");
    }
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary env vars not set, simulating upload!");
    // Fallback if env vars not set
    let p = 0;
    while(p < 100) {
      p += 20;
      if (onProgress) onProgress(Math.min(p, 100));
      await new Promise(res => setTimeout(res, 200));
    }
    return URL.createObjectURL(fileToUpload);
  }

  // Cloudinary upload with progress using XMLHttpRequest
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    xhr.open('POST', url, true);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (err) {
          reject(new Error("Gagal parsing respons dari Cloudinary."));
        }
      } else {
        reject(new Error("Gagal mengunggah foto ke server."));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error("Koneksi bermasalah saat upload foto."));
    };
    
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", uploadPreset);
    
    xhr.send(formData);
  });
};
