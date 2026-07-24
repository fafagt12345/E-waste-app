import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment' });
  }

  try {
    // We fetch the image from Cloudinary to send to Gemini if necessary, 
    // but Gemini API can't take direct URLs, it requires base64 inline data for standard REST API.
    // So we fetch it server-side, convert to base64, and pass to Gemini.
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from Cloudinary. Status: ${imageResponse.status}`);
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const prompt = `
Anda adalah ahli analisis barang elektronik (e-waste). 
Tugas Anda adalah mengenali jenis barang elektronik dari gambar berikut.
Balas HANYA dengan format JSON yang valid (tanpa markdown, tanpa prefix/suffix, jangan gunakan \`\`\`json).

Struktur JSON yang diharapkan:
{
  "itemType": "Nama barang (misal: Smartphone, Laptop, Kipas Angin, TV)",
  "brand": "Merek barang jika terlihat, atau 'Generik' jika tidak jelas (misal: Samsung, Asus, LG)",
  "category": "Kategori barang (pilih salah satu: Gadget / Handphone, Komputer / Laptop, Peralatan Rumah Tangga, Aksesoris & Kabel, Media Player & TV)",
  "estimatedCondition": "Tebak kondisi fisik (pilih salah satu: Masih Berfungsi, Rusak Ringan, Rusak Sedang, Rusak Berat, Mati Total)",
  "description": "Deskripsi singkat mengenai kerusakan atau kondisi fisik yang terlihat",
  "confidenceScore": 90
}
Note: confidenceScore adalah angka bulat 0-100 seberapa yakin Anda dengan analisa ini.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Gemini API Error');
    }

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error("No content returned from Gemini API");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(textContent);
    } catch (e) {
      // If it returned markdown despite the prompt, try cleaning it up
      const cleanedText = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    }

    return res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
}
