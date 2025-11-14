const TelegramBot = require('node-telegram-bot-api');
const { Client } = require('ssh2'); // Gunakan SSH2
const { owner, ownerName, botName, token, photoURL, ADMIN_IDS } = require('./setting');
const path = require("path");
const axios = require("axios");
const crypto = require('crypto');
const qrcode = require('qrcode');
const { premiumUsers } = require('./premium.js');
const fs = require("fs-extra");
const setting = require('./setting.js')
let bot; // Instance bot

// ... (setelah const fs = require("fs-extra");)

function isAdmin(userId) {
  if (!setting.ADMIN_IDS || !Array.isArray(setting.ADMIN_IDS)) {
    return false;
  }
  // Temukan admin berdasarkan ID
  const admin = setting.ADMIN_IDS.find(a => a.id === userId);
  
  if (!admin) {
    return false; // Bukan admin
  }
  
  // Jika expiresAt = null, dia admin permanen
  if (admin.expiresAt === null) {
    return true; 
  }
  
  // Jika tidak null, cek apakah waktunya masih valid
  return admin.expiresAt > Date.now();
}

function startAdminExpiryCheck() {
  log("Sistem pengecekan kedaluwarsa admin dimulai (setiap 5 menit).");
  
  setInterval(() => {
    const now = Date.now();
    
    // Pastikan ADMIN_IDS ada dan merupakan array
    if (!setting.ADMIN_IDS || !Array.isArray(setting.ADMIN_IDS)) {
      return; 
    }

    const originalCount = setting.ADMIN_IDS.length;
    
    // Filter array, hanya pertahankan admin permanen (null) atau yang belum kedaluwarsa
    const activeAdmins = setting.ADMIN_IDS.filter(admin => {
      return admin.expiresAt === null || admin.expiresAt > now;
    });

    // Jika ada yang berubah (ada yang kedaluwarsa)
    if (activeAdmins.length < originalCount) {
      log(`Membersihkan ${originalCount - activeAdmins.length} admin yang kedaluwarsa.`);
      
      // Update data di memori
      setting.ADMIN_IDS = activeAdmins;
      
      // Simpan perubahan ke file setting.js
      const configPath = path.join(__dirname, "setting.js");
      const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
      fs.writeFileSync(configPath, updatedConfig, "utf8");
    }
  }, 5 * 60 * 1000); // Cek setiap 5 menit
}

// ... (ini adalah fungsi isAdmin Anda yang sudah ada)
function isAdmin(userId) {
  if (!setting.ADMIN_IDS || !Array.isArray(setting.ADMIN_IDS)) {
    return false;
  }
  const admin = setting.ADMIN_IDS.find(a => a.id === userId);
  
  if (!admin) {
    return false;
  }
  
  if (admin.expiresAt === null) {
    return true; 
  }
  
  return admin.expiresAt > Date.now();
}

// ⬇️ TAMBAHKAN FUNGSI BARU INI DI BAWAHNYA ⬇️
function isPermanentAdmin(userId) {
  if (!setting.ADMIN_IDS || !Array.isArray(setting.ADMIN_IDS)) {
    return false;
  }
  // Temukan admin berdasarkan ID
  const admin = setting.ADMIN_IDS.find(a => a.id === userId);
  
  if (!admin) {
    return false; // Bukan admin
  }
  
  // HANYA return true jika expiresAt === null
  return admin.expiresAt === null;
}

// === FUNGSI BARU: YouTube Play ===
/**
 * Mengambil link download YouTube dari API Nekolabs.
 * @param {string} query 
 * @returns {object} { success, data, message }
 */
async function getYouTubeSong(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        // Ganti URL ke YouTube Play v1
        const apiUrl = `https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik (YT download bisa lama)
        
        const data = response.data;
        
        if (data.success && data.result) {
            return { success: true, data: data.result };
        } else {
            return { success: false, message: data.message || "❌ Lagu tidak ditemukan." };
        }

    } catch (error) {
        console.error('getYouTubeSong API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ Lagu tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal mengambil lagu.\nPermintaan timeout (60 detik).` };
        }
        return { success: false, message: `❌ Gagal mengambil lagu.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === MODIFIKASI: Fix Parameter Image Enhance (imageUrl) ===
/**
 * Memperbaiki resolusi gambar via API Nekolabs.
 * @param {string} imageUrl URL gambar yang akan di-enhance
 * @returns {object} { success, imageUrl, message }
 */
async function enhanceImage(imageUrl) {
    try {
        const encodedUrl = encodeURIComponent(imageUrl);
        
        // PERBAIKAN: Gunakan parameter 'imageUrl' sesuai contoh CURL
        // API ini sepertinya TIDAK butuh apikey (berdasarkan contoh Anda), tapi jika butuh, tambahkan &apikey=freeApikey
        const apiUrl = `https://api.nekolabs.web.id/tools/pxpic/enhance?imageUrl=${encodedUrl}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik
        
        const data = response.data;
        
        if (data.success && data.result) {
            return { success: true, imageUrl: data.result };
        } else {
            return { success: false, message: data.message || "❌ Gagal enhance gambar." };
        }

    } catch (error) {
        console.error('enhanceImage API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.response && error.response.status === 400) {
             const msg = error.response.data.message || 'Parameter salah.';
             return { success: false, message: `❌ Error API: ${msg}` };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal enhance gambar.\nPermintaan timeout (60 detik).` };
        }
        return { success: false, message: `❌ Gagal enhance gambar.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: Search Image (Google) ===
/**
 * Mencari gambar dari Google via API Siputzx.
 * @param {string} query Kata kunci pencarian
 * @returns {object} { success, imageUrl, message }
 */
async function getGoogleImage(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://api.siputzx.my.id/api/images?query=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 20000 }); // Timeout 20 detik
        
        const data = response.data;
        
        // Cek jika API sukses dan ada data (array)
        if (data.status && data.data && data.data.length > 0) {
            // Ambil 1 gambar secara acak dari hasil
            const images = data.data;
            const randomImage = images[Math.floor(Math.random() * images.length)];
            
            return { success: true, imageUrl: randomImage.url };
        } else {
            return { success: false, message: data.message || "❌ Gambar tidak ditemukan." };
        }

    } catch (error) {
        console.error('getGoogleImage API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal mencari gambar.\nPermintaan timeout (20 detik).` };
        }
        return { success: false, message: `❌ Gagal mencari gambar.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: Fake Data Generator ===
/**
 * Mengambil data palsu dari API Siputzx.
 * @param {number} count Jumlah data yang diminta
 * @returns {object} { success, data (array), message }
 */
async function getFakeData(count = 1) {
    try {
        // Pastikan count adalah angka dan antara 1 - 10 (batasan wajar)
        const dataCount = Math.max(1, Math.min(10, Number(count)));
        
        const apiUrl = `https://api.siputzx.my.id/api/tools/fake-data?type=person&count=${dataCount}`;
        
        const response = await axios.get(apiUrl, { timeout: 20000 }); // Timeout 20 detik
        
        const data = response.data;
        
        // Cek jika API merespons { status: true, data: [...] }
        if (data.status && data.data && data.data.length > 0) {
            return { success: true, data: data.data }; // Kembalikan array data
        } else {
            return { success: false, message: data.message || data.msg || "❌ Gagal mengambil data palsu." };
        }

    } catch (error) {
        console.error('getFakeData API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal mengambil data.\nPermintaan timeout (20 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal mengambil data.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: TikTok Downloader ===
/**
 * Mengambil video TikTok tanpa watermark dari API Nekolabs.
 * @param {string} url URL video TikTok
 * @returns {object} { success, result, message }
 */
async function getTikTokDownloader(url) {
    try {
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://api.nekolabs.web.id/downloader/tiktok?url=${encodedUrl}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik
        
        const data = response.data;
        
        // Cek jika API sukses dan ada result
        if (data.success && data.result && data.result.videoUrl) {
            return { success: true, result: data.result };
        } else {
            return { success: false, message: data.message || "❌ Video tidak ditemukan atau link salah." };
        }

    } catch (error) {
        console.error('getTikTokDownloader API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ Video tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal download video.\nPermintaan timeout (60 detik).` };
        }
        return { success: false, message: `❌ Gagal download video.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: Stalk Instagram ===
/**
 * Mengambil info profil Instagram dari API Siputzx.
 * @param {string} username 
 * @returns {object} { success, data, message }
 */
async function getStalkIG(username) {
    try {
        const encodedUsername = encodeURIComponent(username);
        const apiUrl = `https://api.siputzx.my.id/api/stalk/instagram?username=${encodedUsername}`;
        
        const response = await axios.get(apiUrl, { timeout: 20000 }); // Timeout 20 detik
        
        const data = response.data;
        
        // Cek jika API merespons { status: true, data: {...} }
        if (data.status && data.data && data.data.username) {
            return { success: true, data: data.data };
        } else {
            // Menangani jika API mengembalikan status: false atau tidak ada data
            return { success: false, message: data.message || data.msg || "❌ User tidak ditemukan." };
        }

    } catch (error) {
        console.error('getStalkIG API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ User tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal stalk user.\nPermintaan timeout (20 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal stalk user.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === MODIFIKASI: Fungsi DNS Lookup (Hanya Ambil A Record + Info IP) ===
/**
 * Mengambil info A Record + IP Info dari API Siputzx.
 * @param {string} domain 
 * @returns {object} { success, data (object), message }
 */
async function getDnsLookup(domain) {
    try {
        const encodedDomain = encodeURIComponent(domain);
        const apiUrl = `https://api.siputzx.my.id/api/tools/dns?domain=${encodedDomain}&dnsServer=cloudflare`;
        
        const response = await axios.get(apiUrl, { timeout: 20000 });
        
        const data = response.data;
        
        // Cek jika API merespons { status: true, data: { records: { a: {...} } } }
        if (data.status && data.data && data.data.records && data.data.records.a) {
            
            const aRecordBlock = data.data.records.a;
            
            // Cek jika 'answer' ada dan tidak kosong
            if (aRecordBlock.response && aRecordBlock.response.answer && aRecordBlock.response.answer.length > 0) {
                
                // Ambil record pertama
                const answer = aRecordBlock.response.answer[0];
                
                // Pastikan record dan ipInfo ada
                if (answer.record && answer.ipInfo) {
                    const ip = answer.record.ipv4;
                    const info = answer.ipInfo;
                    
                    // Ekstrak data yang diinginkan
                    const extractedData = {
                        ip: ip || 'N/A',
                        region: info.regionName || 'N/A',
                        city: info.city || 'N/A',
                        country: info.country || 'N/A',
                        isp: info.org || info.asname || 'N/A' // Ambil 'org' atau 'asname'
                    };
                    // Kembalikan sebagai object
                    return { success: true, data: extractedData }; 
                }
            }
            
            // Jika 'answer' kosong (domain ada tapi tidak ada A record)
            return { success: false, message: "❌ Tidak ada 'A Record' (IP Address) yang ditemukan untuk domain ini." };

        } else {
            // Jika API gagal atau 'a' record tidak ada
            return { success: false, message: data.message || data.msg || "❌ Gagal mengambil info DNS (Domain tidak ditemukan atau format API berubah)." };
        }

    } catch (error) {
        console.error('getDnsLookup API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal mengambil info DNS.\nPermintaan timeout (20 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal mengambil info DNS.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === MODIFIKASI: Instagram Downloader (Siputzx) ===
/**
 * Mengambil media Instagram (Video/Foto) dari API Siputzx.
 * @param {string} url URL Instagram
 * @returns {object} { success, data (array of strings), message }
 */
async function getInstagramDownloader(url) {
    try {
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodedUrl}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik
        
        const data = response.data;
        
        // Cek struktur JSON Siputzx { status: true, data: [...] }
        // JSON Anda: data.status = true, data.data = [{ url: "..." }]
        if (data.status && data.data && Array.isArray(data.data) && data.data.length > 0) {
            
            // Mapping data untuk mengambil URL-nya saja
            const mediaUrls = data.data.map(item => {
                if (typeof item === 'object') {
                    // Kode ini akan mengambil "url" dari JSON yang Anda kirim
                    return item.url || item.download_url || ''; 
                }
                return item; // Jika API mengembalikan string langsung
            }).filter(link => link && typeof link === 'string'); // Hapus yang kosong

            if (mediaUrls.length === 0) {
                return { success: false, message: "❌ Gagal mem-parsing link media dari API." };
            }

            return { success: true, data: mediaUrls };
        } else {
            return { success: false, message: data.message || "❌ Media tidak ditemukan atau akun private." };
        }

    } catch (error) {
        console.error('getInstagramDownloader API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal download.\nPermintaan timeout (60 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error API: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal download.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === MODIFIKASI: Perbaikan Fungsi Primbon Arti Nama (v3 - Final) ===
/**
 * Mengambil arti nama dari API Siputzx.
 * @param {string} nama 
 * @returns {object} { success, result, message }
 */
async function getArtiNama(nama) {
    try {
        const encodedNama = encodeURIComponent(nama);
        const apiUrl = `https://api.siputzx.my.id/api/primbon/artinama?nama=${encodedNama}`;
        
        const response = await axios.get(apiUrl, { timeout: 20000 }); // Timeout 20 detik
        
        const data = response.data;
        
        // Cek jika API merespons { status: true, data: ... }
        if (data.status && data.data) {
            
            let resultText = "";
            
            // === PERBAIKAN DI SINI ===
            // Cek format dari console log: { data: { nama: "...", arti: "...", catatan: "..." } }
            if (data.data.arti && typeof data.data.arti === 'string') {
                // Gabungkan arti dan catatan untuk balasan yang bagus
                resultText = data.data.arti;
                if (data.data.catatan) {
                    resultText += `\n\nCatatan: ${data.data.catatan}`;
                }
            
            // Fallback (jaga-jaga jika API berubah)
            } else if (typeof data.data === 'string') {
                resultText = data.data;
            } else if (data.data.result && typeof data.data.result === 'string') {
                resultText = data.data.result;
            } else {
                // Jika semua gagal, log ke konsol dan kirim error
                console.error("Format API /artinama tidak dikenal:", data.data);
                return { success: false, message: "❌ Gagal mem-parsing respons API (format data tidak dikenal)." };
            }
            // === AKHIR PERBAIKAN ===

            return { success: true, result: resultText };
            
        } else {
            // Menangani jika API mengembalikan status: false atau tidak ada data
            return { success: false, message: data.message || data.msg || "❌ Gagal mengambil arti nama." };
        }

    } catch (error) {
        console.error('getArtiNama API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal mengambil arti nama.\nPermintaan timeout (20 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal mengambil arti nama.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: Primbon Zodiak ===
/**
 * Mengambil info zodiak dari API Siputzx.
 * @param {string} zodiak 
 * @returns {object} { success, data, message }
 */
async function getZodiacInfo(zodiak) {
    try {
        const encodedZodiak = encodeURIComponent(zodiak.toLowerCase());
        const apiUrl = `https://api.siputzx.my.id/api/primbon/zodiak?zodiak=${encodedZodiak}`;
        
        const response = await axios.get(apiUrl, { timeout: 20000 }); // Timeout 20 detik
        
        const data = response.data;
        
        // Cek jika API merespons { status: true, data: {...} }
        if (data.status && data.data && data.data.zodiak) {
            return { success: true, data: data.data };
        } else {
            // Menangani jika API mengembalikan status: false atau tidak ada data
            return { success: false, message: data.message || data.msg || "❌ Zodiak tidak ditemukan." };
        }

    } catch (error) {
        console.error('getZodiacInfo API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal mengambil info zodiak.\nPermintaan timeout (20 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal mengambil info zodiak.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: Subdomain Sniffer ===
/**
 * Mencari subdomain dari sebuah domain via API Siputzx.
 * @param {string} domain 
 * @returns {object} { success, result (string), message }
 */
async function getDomainSniffer(domain) {
    try {
        const encodedDomain = encodeURIComponent(domain);
        const apiUrl = `https://api.siputzx.my.id/api/tools/subdomains?domain=${encodedDomain}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik (scan bisa lama)
        
        const data = response.data;
        
        // Cek jika API merespons { status: true, data: [...] }
        if (data.status && data.data && data.data.length > 0) {
            
            // API mengembalikan array string, di mana setiap string bisa berisi \n
            // 1. Gabungkan semua string di array jadi satu string besar
            // 2. Pisahkan string besar itu berdasarkan \n
            // 3. Gunakan Set untuk menghapus duplikat
            // 4. Gabungkan lagi dengan \n
            
            const flatList = data.data.join('\n').split('\n');
            const uniqueList = [...new Set(flatList)];
            const resultText = uniqueList.join('\n');
            
            return { success: true, result: resultText };
        } else {
            return { success: false, message: data.message || data.msg || "❌ Gagal mencari subdomain (domain tidak ditemukan atau tidak ada data)." };
        }

    } catch (error) {
        console.error('getDomainSniffer API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal mencari subdomain.\nPermintaan timeout (60 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal mencari subdomain.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: Translate ===
/**
 * Menerjemahkan teks menggunakan API Siputzx.
 * @param {string} text Teks yang akan diterjemahkan
 * @param {string} sourceLang Bahasa asal (cth: 'id')
 * @param {string} targetLang Bahasa tujuan (cth: 'en')
 * @returns {object} { success, result, message }
 */
async function getTranslation(text, sourceLang, targetLang) {
    try {
        const encodedText = encodeURIComponent(text);
        const apiUrl = `https://api.siputzx.my.id/api/tools/translate?text=${encodedText}&source=${sourceLang}&target=${targetLang}`;
        
        const response = await axios.get(apiUrl, { timeout: 20000 }); // 20s timeout
        
        const data = response.data;
        
        // Cek sukses berdasarkan API response
        if (data.status && data.data && data.data.translatedText) {
            return { success: true, result: data.data.translatedText };
        } else {
            return { success: false, message: data.message || data.msg || "❌ Gagal menerjemahkan." };
        }

    } catch (error) {
        console.error('getTranslation API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ API tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ Gagal menerjemahkan.\nPermintaan timeout (20 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal menerjemahkan.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: AI (GPT-5 Nekolabs) ===
/**
 * Mengambil respons AI dari API Nekolabs.
 * @param {string} query Teks pertanyaan dari user
 * @param {string} sessionId ID unik untuk user (kita pakai userId)
 * @returns {object} { success, result, message }
 */
async function getAiResponse(query, sessionId) {
    try {
        const encodedQuery = encodeURIComponent(query);
        // Sesuai screenshot, kita set systemPrompt default
        const systemPrompt = encodeURIComponent("Tanyakan apa saja, Saya akan menjawab");
        
        const apiUrl = `https://api.nekolabs.web.id/ai/gpt/5?text=${encodedQuery}&systemPrompt=${systemPrompt}&sessionId=${sessionId}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik (AI bisa lama)
        
        const data = response.data;
        
        if (data.success && data.result) {
            return { success: true, result: data.result };
        } else {
            return { success: false, message: data.message || "❌ AI gagal merespons." };
        }

    } catch (error) {
        console.error('getAiResponse API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ Layanan AI tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ AI gagal merespons.\nPermintaan timeout (60 detik).` };
        }
        return { success: false, message: `❌ Gagal menghubungi AI.\nTerjadi kesalahan: ${error.message}` };
    }
}

// === FUNGSI BARU: AIV3 (Meta AI) ===
/**
 * Mengambil respons AI dari API Siputzx (Meta AI).
 * @param {string} query Teks pertanyaan dari user
 * @returns {object} { success, result, message }
 */
async function getMetaAiResponse(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://api.siputzx.my.id/api/ai/metaai?query=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik (AI bisa lama)
        
        const data = response.data;
        
        // Cek jika API merespons { status: true, data: "..." }
        if (data.status && data.data && typeof data.data === 'string') {
            return { success: true, result: data.data };
        } else {
            return { success: false, message: data.message || data.msg || "❌ AI (v3) gagal merespons." };
        }

    } catch (error) {
        console.error('getMetaAiResponse API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ Layanan AI (v3) tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ AI (v3) gagal merespons.\nPermintaan timeout (60 detik).` };
        }
        if (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) {
            return { success: false, message: `❌ Error: ${error.response.data.message || error.response.data.msg}` };
        }
        return { success: false, message: `❌ Gagal menghubungi AI (v3).\nTerjadi kesalahan: ${error.message}` };
    }
}

// === TAMBAHKAN FUNGSI-FUNGSI INI ===
const ownersFile = 'data/owners.json';
if (!fs.existsSync(ownersFile)) fs.writeFileSync(ownersFile, '{}', 'utf8');

function loadOwners() {
    try {
        return JSON.parse(fs.readFileSync(ownersFile, 'utf8'));
    } catch (e) {
        console.error("Gagal memuat owners:", e);
        return {};
    }
}

function saveOwners(data) {
    try {
        fs.writeFileSync(ownersFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Gagal menyimpan owners:", e);
    }
}

/**
 * Cek apakah user adalah Super Admin (owner) ATAU sub-owner.
 */
function isOwner(userId) {
    const userIdStr = String(userId);
    // Cek apakah dia Super Admin
    if (userIdStr === String(owner)) {
        return true;
    }
    
    // Cek apakah dia terdaftar di db/owners.json
    const owners = loadOwners();
    return !!owners[userIdStr];
}

// === FUNGSI BARU: AIV2 (Claude Sonnet 4.5) ===
/**
 * Mengambil respons AI dari API Nekolabs (Claude Sonnet 4.5).
 * @param {string} query Teks pertanyaan dari user
 * @param {string} sessionId ID unik untuk user (kita pakai userId)
 * @returns {object} { success, result, message }
 */
async function getAiV2Response(query, sessionId) {
    try {
        const encodedQuery = encodeURIComponent(query);
        
        // Menggunakan URL baru (Claude Sonnet 4.5)
        // Asumsi parameternya adalah 'text' dan 'sessionId'
        const apiUrl = `https://api.nekolabs.web.id/ai/claude/sonnet-4.5?text=${encodedQuery}&sessionId=${sessionId}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Timeout 60 detik (AI bisa lama)
        
        const data = response.data;
        
        if (data.success && data.result) {
            return { success: true, result: data.result };
        } else {
            return { success: false, message: data.message || "❌ AI (v2) gagal merespons." };
        }

    } catch (error) {
        console.error('getAiV2Response API error:', error.message);
        if (error.response && error.response.status === 404) {
            return { success: false, message: "❌ Layanan AI (v2) tidak ditemukan (404)." };
        }
        if (error.code === 'ECONNABORTED') {
             return { success: false, message: `❌ AI (v2) gagal merespons.\nPermintaan timeout (60 detik).` };
        }
        return { success: false, message: `❌ Gagal menghubungi AI (v2).\nTerjadi kesalahan: ${error.message}` };
    }
}

function isValidIP(ip) {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipRegex.test(ip);
}
global.subdomain = { 
    "cjdw.me": {
        zone: "ea4a4028d893149fda5bd28b270de74d",
        apitoken: "0Ra07Oo6vu9JnBtIMnaKiTBniJJcFSSOxmu-DcCw"
    }
};

const log = (message, error = null) => {
  const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
  const prefix = `\x1b[36m[ Nando Obf Botz ]\x1b[0m`;
  const timeStyle = `\x1b[33m[${timestamp}]\x1b[0m`;
  const msgStyle = `\x1b[32m${message}\x1b[0m`;
  console.log(`${prefix} ${timeStyle} ${msgStyle}`);
  if (error) {
    const errorStyle = `\x1b[31m✖ Error: ${error.message || error}\x1b[0m`;
    console.error(`${prefix} ${timeStyle} ${errorStyle}`);
    if (error.stack) console.error(`\x1b[90m${error.stack}\x1b[0m`);
  }
};

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify([...users], null, 2));
  } catch (error) {
    log("Gagal menyimpan pengguna ke JSON", error);
  }
}

const users = [];
const userData = {};

function example() {
  return "Contoh penggunaan: /installpanel ip|password|domainpanel|domainnode|ramserver";
}

const pendingAdminPayments = {};
function setBotInstance(botInstance) {
  bot = botInstance;
  
  // TAMBAHKAN INI DI AWAL FUNGSI
  startAdminExpiryCheck(); 
  
  // ... (si
    
const dataDir = path.join(__dirname, 'data');
const dataFiles = ['users.json'];
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
for (const f of dataFiles) {
  const filePath = path.join(dataDir, f);
  if (!fs.existsSync(filePath)) fs.writeJsonSync(filePath, []);
  else if (fs.readFileSync(filePath, 'utf8').trim() === '') fs.writeJsonSync(filePath, []);
}
const welcomeAudio = path.join(__dirname, 'Musik.mp3');
// ─── /menu ───────────────────────────────
bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;  // Definisi chatId
  const menuText = `
<blockquote>╭─────( 𝗔𝗟𝗟 𝗜𝗡 𝗢𝗡𝗘 )───────╮
│ϟ ɴᴀᴍᴇ ʙᴏᴛ : ᴀʟʟ ɪɴ ᴏɴᴇ
│ϟ ᴠᴇʀsɪᴏɴ : 3.0 Latest ᴠɪᴘ
│ϟ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @sipicung
│ϟ ᴏᴡɴᴇʀ : @sipicung
│ϟ ɪɴғᴏʀᴍᴀᴛɪᴏɴ : @tokopicung
╰───────────────────╯</blockquote>
<blockquote>╭────────( 𝙐𝙨𝙚𝙧 )──────╮
│ⵢ ᴜsᴇʀ : ${chatId}
╰───────────────────╯</blockquote>
<blockquote>╭──────( 𝘽𝙐𝙔 𝘼𝙆𝙎𝙀𝙎 )────╮
│ⵢ ᴋᴇᴛɪᴋ : /buyakses
╰───────────────────╯</blockquote>
  `;  // Teks caption untuk menu
  
  const keyboard = {
    parse_mode: "HTML",
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⿻ ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ", callback_data: "protectmenu" },
          { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "unprotect" },
        ],
        [
          { text: "ᴅᴇᴠᴇʟᴏᴘᴇʀ", callback_data: "tqto" },
          { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ʙᴜʏ sᴄʀɪᴘᴛ", url: "t.me/sipicung" }
        ]
      ],
    },
  };
  
  bot.sendPhoto(chatId, photoURL, {
    caption: menuText,
    ...keyboard
  });
});


// ==========================================================
// PENGGANTI SEMUA bot.on("callback_query", ...)
// HAPUS SEMUA HANDLER LAMA DAN GANTI DENGAN YANG INI
// ==========================================================
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const msg = callbackQuery.message; // Untuk handler subdomain & cancel

  // 1. Handler untuk Menu Utama (protectmenu, unprotect, dll)
  if (data === "protectmenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>╭──✧ <b>ᴘᴛᴇʀᴏᴅᴀᴄᴛʏʟ ᴍᴇɴᴜ</b> ✧
│ ⪼ /installpanel
│ ⪼ /uninstallpanel
│ ⪼ /swings
╰────────────⧽
╭──✧ <b>ᴛᴏᴏʟꜱ ᴍᴇɴᴜ</b> ✧
│ ⪼ /subdo
│ ⪼ /listsubdo
│ ⪼ /dns -- ᴍᴀꜱᴜᴋᴀɴ ꜱᴜʙᴅᴏᴍᴀɪɴ
│ ⪼ /sniffdomain -- ᴍᴀꜱᴜᴋᴀɴ ᴅᴏᴍᴀɪɴ
│ ⪼ /hd -- ʀᴇᴘʟʏ ɢᴀᴍʙᴀʀ
│ ⪼ /fakedata
╰────────────⧽
╭──✧ <b>ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴍᴇɴᴜ</b> ✧
│ ⪼ /ig -- ʟɪɴᴋ ᴘᴏꜱᴛɪɴɢᴀɴ
│ ⪼ /tiktok -- ʟɪɴᴋ ᴘᴏꜱᴛɪɴɢᴀɴ
│ ⪼ /searchimg -- ᴋᴀᴛᴀ ᴋᴜɴᴄɪ
╰────────────⧽
╭──✧ <b>ᴀɪ ᴍᴇɴᴜ</b> ✧
│ ⪼ /ai -- ᴄʜᴀᴛɢᴘᴛ 5
│ ⪼ /aiv2 -- ᴄʟᴀᴜᴅᴇ 4.5
│ ⪼ /aiv3 -- ᴍᴇᴛᴀ ᴀɪ
╰────────────⧽
╭──✧ <b>ᴛʀᴀɴꜱʟᴀᴛᴇ ᴍᴇɴᴜ</b> ✧
│ ⪼ /id_en -- ᴍᴀꜱᴜᴋᴀɴ ᴛᴇᴋꜱ
│ ⪼ /en_id -- ᴍᴀꜱᴜᴋᴀɴ ᴛᴇᴋꜱ
╰────────────⧽
╭──✧ <b>ꜰᴜɴ ᴍᴇɴᴜ</b> ✧
│ ⪼ /play -- ᴊᴜᴅᴜʟ ʟᴀɢᴜ 
│ ⪼ /cosplay -- ʀᴀɴᴅᴏᴍ
│ ⪼ /loli -- ᴘᴀꜱᴛɪ ꜱᴜᴋᴀ 
│ ⪼ /waifu -- ᴡᴀɪꜰᴜ ᴋᴀᴍᴜ
│ ⪼ /hentai -- ʜᴀʀᴀᴍ ʙᴏꜱ
│ ⪼ /brat -- ᴛᴇᴋꜱ
│ ⪼ /qc -- ʀᴇᴘʟʏ ᴛᴇᴋꜱ
│ ⪼ /artinama -- ɴᴀᴍᴀ ᴋᴀᴍᴜ
│ ⪼ /zodiac -- ᴢᴏᴅɪᴀᴄ ᴋᴀᴍᴜ
╰────────────⧽
</blockquote>`;

    bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          // === PERBAIKAN: Hanya tombol Back ===
          [
            { text: "<<", callback_data: "back" }
          ]
          // === AKHIR PERBAIKAN ===
        ],
      },
    });
  }

  // 2. Handler untuk "unprotect"
  else if (data === "unprotect") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>╭──✧ <b>ɪɴꜰᴏʀᴍᴀᴛɪon</b> ✧
│ ⪼ Version : 3.0 Latest 
│ ⪼ Owner : @sipicung
│ ⪼ Language : JavaScript
╰────────────⧽

╭──✧ <b>ᴏᴡɴᴇʀ ᴘʀɪᴠᴀᴛᴇ</b> ✧
│ ⪼ /installprotectall
│ ⪼ /uninstallprotectall
╰────────────
</blockquote>`;

    bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          // === PERBAIKAN: Hanya tombol Back ===
          [
            { text: "<<", callback_data: "back" }
          ]
          // === AKHIR PERBAIKAN ===
        ],
      },
    });
  }

  // 3. Handler untuk "ownermenu"
  else if (data === "ownermenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪon</b> ⧽
│✘ Version : 3.0 Latest
│✘ Owner : @sipicung
│✘ Language : JavaScript
╰─────────────

┌─⧼ ᴏᴡɴᴇR ᴍᴇɴᴜ ⧽
│ⵢ /addsewa -- ɪᴅᴛᴇʟᴇ ᴅᴜʀᴀꜱɪ
│ⵢ /addowner -- ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ꜱᴄʀɪᴘᴛ  
│ⵢ /deladmin -- ɪᴅᴛᴇʟᴇ
│ⵢ /listsewa
│ⵢ /setpwvps
│ⵢ /hbpanel
╰─────────────
</blockquote>`;

    bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          // === PERBAIKAN: Hanya tombol Back ===
          [
            { text: "<<", callback_data: "back" }
          ]
          // === AKHIR PERBAIKAN ===
        ],
      },
    });
  }

  // 4. Handler untuk "tqto"
  else if (data === "tqto") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>╭──✧ <b>ɪɴꜰᴏʀᴍᴀᴛɪon</b> ✧
│ ⪼ Version : 3.0 Latest 
│ ⪼ Owner : @sipicung
│ ⪼ Language : JavaScript
╰────────────⧽

╭──✧ ᴛʜᴀɴᴋs ᴅᴇᴠᴇʟᴏᴘᴇʀ ✧
│ ⪼ Allah ( Good ) 
│ ⪼ @sipicung ( Dev ) 
╰────────────
</blockquote>`;

    bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          // === PERBAIKAN: Hanya tombol Back ===
          [
            { text: "<<", callback_data: "back" }
          ]
          // === AKHIR PERBAIKAN ===
        ],
      },
    });
  }

  // 5. Handler untuk "back" (Digabung dari file Anda)
  else if (data === "back") {
    await bot.answerCallbackQuery(callbackQuery.id);

    const text = `<blockquote>╭─────( 𝗔𝗟𝗟 𝗜𝗡 𝗢𝗡𝗘 )───────╮
│ϟ ɴᴀᴍᴇ ʙᴏᴛ : ᴀʟʟ ɪɴ ᴏɴᴇ
│ϟ ᴠᴇʀsɪon : 3.0 Latest ᴠɪᴘ
│ϟ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @sipicung
│ϟ ᴏᴡɴᴇʀ : @sipicung
│ϟ ɪɴғᴏʀᴍᴀᴛɪon : @tokopicung
╰───────────────────╯</blockquote>
<blockquote>╭───────( 𝙐𝙨𝙚r )───────╮
│ⵢ ᴜsᴇʀ : ${chatId}
╰───────────────────╯</blockquote>
<blockquote>──────( 𝘽𝙐𝙔 𝘼𝙆𝙎𝙀𝙎 )────╮
│ⵢ ᴋᴇᴛɪᴋ : /buyakses
╰───────────────────╯</blockquote>`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⿻ ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ", callback_data: "protectmenu" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "unprotect" },
          ],
          [
            { text: "ᴅᴇᴠᴇʟᴏᴘᴇʀ", callback_data: "tqto" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" },
          ],
          [
            { text: "ʙᴜʏ sᴄʀɪᴘᴛ", url: "https://t.me/sipicung" },
          ],
        ],
      },
    };
    
// Hapus pesan lama (menu) agar tidak duplikat
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch(e) {}

    // Kirim foto utama dengan caption dan tombol
    await bot.sendPhoto(chatId, photoURL, {
      caption: text,
      parse_mode: "HTML",
      ...keyboard,
    });
  } // <--- Menutup blok IF/ELSE IF sebelumnya (PENTING)

  // 6. Handler untuk "CANCEL_ADMIN" (Digabung dari kode /buyakses)
  else if (data.startsWith("CANCEL_ADMIN|")) {
    const reff = data.split("|")[1];
    const order = pendingAdminPayments[reff];

    if (order) {
      // Hapus dari daftar pending
      delete pendingAdminPayments[reff];
      
      // Hapus pesan QR
      try {
        await bot.deleteMessage(chatId, order.messageId);
      } catch (e) { /* biarkan */ }

      await bot.answerCallbackQuery(callbackQuery.id, { text: "Pesanan dibatalkan." });
      await bot.sendMessage(chatId, "Pesanan telah dibatalkan.");
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Pesanan tidak ditemukan/sudah kedaluwarsa." });
      try {
         await bot.deleteMessage(chatId, msg.message_id); // Hapus pesan yg sudah tidak valid
      } catch(e) {}
    }
  }

}); // <--- PERBAIKAN: Ubah )}; menjadi });

  
// ==========================================================
// AKHIR DARI BLOK PENGGANTI
// ==========================================================

  // ─── /fiturpremium ───────────────────────
  bot.onText(/^\/fiturpremium$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!premiumUsers.includes(userId)) {
      return bot.sendMessage(chatId, '❌ Kamu bukan user premium!');
    }

    bot.sendMessage(chatId, '✨ Selamat datang di fitur *Premium Eksklusif*!', { parse_mode: 'Markdown' });
  });
  
// === MODIFIKASI: Perintah Beli Admin (/buyakses) - dengan KEDALUWARSA ===
bot.onText(/^\/buyakses$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userFirstName = msg.from.first_name || "Telegram User";
    const userUsername = msg.from.username || "tanpa_username";

    // 1. Tentukan detail produk (Ambil dari setting, beri fallback jika belum di-set)
    const amount = setting.ADMIN_PRICE || 10000; 
    const durationDays = setting.ADMIN_DURATION || 1; 
    const productName = `Akses Admin Bot (${durationDays} Hari)`;
    const productId = "ADMIN_ACCESS";

    // 2. Cek jika user sudah jadi admin
    if (isAdmin(userId)) {
      return bot.sendMessage(chatId, "Anda sudah menjadi Admin.");
    }

    const reff = `buyakses-${userId}-${Date.now()}`;

    // 3. Buat signature Duitku
    const rawSignature = setting.DUITKU_MERCHANT_CODE + reff + amount + setting.DUITKU_API_KEY;
    const signature = crypto.createHash("md5").update(rawSignature).digest("hex");

    let paymentResp;
    try {
      // 4. Request Inquiry ke Duitku
      paymentResp = await axios.post("https://passport.duitku.com/webapi/api/merchant/v2/inquiry", {
        merchantCode: setting.DUITKU_MERCHANT_CODE,
        paymentAmount: amount,
        paymentMethod: "SP", // QRIS
        merchantOrderId: reff,
        productDetails: `Pembelian ${productName}`,
        customerVaName: userFirstName,
        email: `${userId}@telegram.bot`, 
        phoneNumber: "08123456789",
        itemDetails: [{
          name: productName,
          price: amount,
          quantity: 1
        }],
        callbackUrl: `https://example.com/callback/${reff}`, // URL ini tidak dipakai jika kita polling
        returnUrl: `https://example.com/return/${reff}`,
        signature: signature,
        expiryPeriod: 5 // Kadaluarsa 5 menit
      }, {
        headers: { "Content-Type": "application/json" }
      });

    } catch (e) {
      console.error("Duitku inquiry error (/buyakses):", e.response ? e.response.data : e.message);
      return bot.sendMessage(chatId, "Gagal menghubungi gateway Duitku. Coba lagi nanti.");
    }

    const result = paymentResp.data;

    // 5. Cek respon Duitku
    if (result.statusCode !== "00") {
      console.error("Duitku Error Response (/buyakses):", result);
      return bot.sendMessage(chatId, "Gagal membuat transaksi Duitku: " + result.statusMessage);
    }

    const qrString = result.qrString;
    const reference = result.reference; 
    const checkoutUrl = result.paymentUrl;

    // 6. Buat QR Code dari qrString
    const buffer = await qrcode.toBuffer(qrString, { width: 400, color: { dark: "#000000", light: "#ffffff" } });

    // 7. Kirim QR Code ke user
    const caption = `<b>𝗜𝗡𝗩𝗢𝗜𝗖𝗘 𝗣𝗔𝗬𝗠𝗘𝗡𝗧</b> 💰

𝗣𝗿𝗼𝗱𝘂𝗸 : ${productName}
𝗧𝗼𝘁𝗮𝗹 𝗧𝗮𝗴𝗶𝗵𝗮𝗻 : Rp${amount.toLocaleString('id-ID')}
𝗕𝗶𝗮𝘆𝗮 𝗔𝗱𝗺𝗶𝗻 : Rp0
<i>Qris Kadaluarsa Dalam : 5 menit</i>
------------------------------------------
🕓 Sistem akan <b>cek otomatis</b> setiap 15 detik hingga pembayaran terverifikasi.`;

    const sentMsg = await bot.sendPhoto(chatId, buffer, {
      caption: caption,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Bayar di Website", url: checkoutUrl }],
          [{ text: "❌ Batalkan", callback_data: `CANCEL_ADMIN|${reff}` }]
        ]
      }
    });

    // 8. Simpan order ke memory
    pendingAdminPayments[reff] = {
      reff,
      productId: productId,
      userId: userId, 
      buyerUsername: userUsername,
      status: "pending",
      created: Date.now(),
      reference, 
      paymentData: result,
      messageId: sentMsg.message_id,
      chatId: chatId,
      durationDays: durationDays // Simpan durasi
    };

    // 9. POLLING PEMBAYARAN
    let attempts = 0;
    const maxAttempts = 20; 
    const interval = setInterval(async () => {
      attempts++;
      
      const order = pendingAdminPayments[reff];
      
      if (!order) {
        clearInterval(interval);
        return;
      }

      if (attempts > maxAttempts) {
        clearInterval(interval);
        if (order.status === "pending") {
          try {
            await bot.deleteMessage(order.chatId, order.messageId);
          } catch (e) { /* biarkan */ }
          
          delete pendingAdminPayments[reff];
          await bot.sendMessage(order.chatId, "⏳ Invoice kadaluarsa, silakan buat order baru jika ingin melanjutkan.");
        }
        return;
      }

      try {
        // 10. Cek status Duitku
        const sigCheck = crypto.createHash("md5")
          .update(setting.DUITKU_MERCHANT_CODE + reff + setting.DUITKU_API_KEY)
          .digest("hex");

        const statusResp = await axios.post("https://passport.duitku.com/webapi/api/merchant/transactionStatus", {
          merchantCode: setting.DUITKU_MERCHANT_CODE,
          merchantOrderId: reff,
          signature: sigCheck
        }, {
          headers: { "Content-Type": "application/json" }
        });

        const status = statusResp?.data?.statusCode;

        if (status === "00") { // "00" = Sukses
          clearInterval(interval);
          
          const finalOrder = pendingAdminPayments[reff];
          if (!finalOrder || finalOrder.status === "paid") return; 

          finalOrder.status = "paid";

          // 11. LOGIKA SUKSES
          try {
            
            // Hitung waktu kedaluwarsa (berdasarkan durasi dari setting)
            const expiryTime = Date.now() + (finalOrder.durationDays * 24 * 60 * 60 * 1000); 
            
            // Tambahkan user sebagai admin dengan waktu kedaluwarsa
            setting.ADMIN_IDS.push({ 
              id: finalOrder.userId, 
              expiresAt: expiryTime 
            });
            
            // Simpan file setting.js
            const configPath = path.join(__dirname, "setting.js");
            const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
            fs.writeFileSync(configPath, updatedConfig, "utf8");
            
            log(`User ${finalOrder.userId} berhasil ditambahkan sebagai admin ( ${finalOrder.durationDays} hari ).`);

            // 12. Kirim pesan sukses ke pembeli
            await bot.editMessageCaption(`<b>𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟</b> ✅
            
𝗡𝗼𝗺𝗼𝗿 𝗥𝗲𝗳𝗲𝗿𝗲𝗻𝘀𝗶 : ${reff}
𝗜𝗗 𝗧𝗿𝗮𝗻𝘀𝗮𝗸𝘀𝗶 : ${reference}
𝗦𝘁𝗮𝘁𝘂𝘀 : Berhasil
------------------------------------------
𝗣𝗿𝗼𝗱𝘂𝗸 : ${productName}
𝗧𝗼𝘁𝗮𝗹 𝗧𝗮𝗴𝗶𝗵𝗮𝗻 : Rp${amount.toLocaleString('id-ID')}
------------------------------------------
🎉 <b>Selamat!</b> Akun Anda telah di-upgrade menjadi <b>Admin</b>.
Akses ini akan berlaku selama <b>${finalOrder.durationDays} hari</b>.

Silakan gunakan menu /start untuk melihat fitur admin Anda.`, {
              chat_id: finalOrder.chatId,
              message_id: finalOrder.messageId,
              parse_mode: "HTML",
              reply_markup: {} 
            });
            
            // 13. Kirim log ke Admin/Owner (Opsional)
            await bot.sendMessage(owner, 
`<b>PEMBELIAN ADMIN BARU</b> ✅
------------------------------------------
👤 User: @${finalOrder.buyerUsername} (ID: ${finalOrder.userId})
Telah membeli ${productName}.`, { parse_mode: "HTML" });

          } catch (error) {
            console.error(error);
            await bot.sendMessage(
              finalOrder.chatId,
              "⚠️ Pembayaran sukses, tapi terjadi kesalahan dalam upgrade akun. Silakan hubungi admin."
            );
          } finally {
            delete pendingAdminPayments[reff];
          }

        } else if (status === "01") {
          // Pending, biarkan
        } else if (status) {
          // Gagal/Expired
          clearInterval(interval);
          delete pendingAdminPayments[reff];
          
          try {
            await bot.deleteMessage(order.chatId, order.messageId);
          } catch (e) {/* biarkan */}
          
          await bot.sendMessage(order.chatId, `⏳ Invoice gagal atau kadaluarsa (Status: ${statusResp?.data?.statusMessage || 'N/A'}). Silakan buat order baru.`);
        }
      } catch (e) {
        console.error("checkPayment (Duitku /buyakses) error", e);
      }
    }, 15000); 
  });

// === MODIFIKASI: Ganti /addadmin menjadi /addsewa ===
bot.onText(/\/addsewa (\d+) (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // 1. PERBAIKAN: Cek jika dia Owner (bukan cuma PermanentAdmin)
    if (!isOwner(senderId)) { 
        return bot.sendMessage(chatId, '❌ Hanya Owner yang bisa menggunakan perintah ini.');
    }

    const userIdToAdd = Number(match[1]);
    const duration = parseInt(match[2], 10); // Durasi (hari) sekarang wajib

    if (duration <= 0) {
        return bot.sendMessage(senderId, "⚠️ Durasi hari harus lebih dari 0.");
    }
    
    // Cek jika user sudah admin (untuk menghindari duplikat)
    if (isAdmin(userIdToAdd)) {
         return bot.sendMessage(senderId, "⚠️ User ini sudah menjadi admin. Gunakan /delsewa dulu jika ingin reset.");
    }

    // 2. PERBAIKAN: Logika diubah untuk selalu menggunakan durasi (tidak ada -1)
    const expiryTimestamp = Date.now() + (duration * 24 * 60 * 60 * 1000);
    
    // Tambahkan ke ADMIN_IDS di setting
    setting.ADMIN_IDS.push({ id: userIdToAdd, expiresAt: expiryTimestamp });

    // Simpan ke config.js
    const configPath = path.join(__dirname, "setting.js");
    const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
    fs.writeFileSync(configPath, updatedConfig, "utf8");
    
    // 3. PERBAIKAN: Ubah pesan balasan
    const expiryDate = new Date(expiryTimestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    let replyMsg = `✅ Sewa admin untuk ID \`${userIdToAdd}\` berhasil ditambahkan.\nAktif selama: *${duration} hari*.\nKedaluwarsa: *${expiryDate}*`;
    
    await bot.sendMessage(senderId, replyMsg, { parse_mode: 'Markdown' });

    try {
        await bot.sendMessage(userIdToAdd, `🎉 Kamu telah ditambahkan sebagai *Admin Sewa* oleh <b>${msg.from.first_name}</b>.\nAkses berakhir pada: ${expiryDate}`, { parse_mode: "HTML" });
    } catch (err) {
        console.log("Gagal kirim notifikasi ke admin baru:", err.message);
    }
});

// === MODIFIKASI: Ganti /deladmin menjadi /delsewa ===
bot.onText(/\/delsewa (\d+)/, async (msg, match) => {
  const senderId = msg.from.id;
  const targetId = Number(match[1]);

  // 1. PERBAIKAN: Cek jika dia Owner
  if (!isOwner(senderId)) {
    return bot.sendMessage(senderId, "❌ Hanya Owner yang bisa menggunakan perintah ini.");
  }

  // 2. Cek jika target adalah Super Admin
  if (String(targetId) === String(owner)) {
    return bot.sendMessage(senderId, "❌ Anda tidak bisa menghapus Super Admin.");
  }
  
  // Cek jika targetnya adalah admin
  if (!isAdmin(targetId))
    return bot.sendMessage(senderId, "⚠️ User ini bukan admin.");

  // Hapus admin berdasarkan ID dari array objek
  setting.ADMIN_IDS = setting.ADMIN_IDS.filter(admin => admin.id !== targetId);

  // Simpan ke config.js
  const configPath = path.join(__dirname, "setting.js");
  const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
  fs.writeFileSync(configPath, updatedConfig, "utf8");

  await bot.sendMessage(senderId, `🗑️ Admin sewa dengan ID <code>${targetId}</code> berhasil dihapus.`, { parse_mode: "HTML" });

  try {
    await bot.sendMessage(targetId, `⚠️ Kamu telah dihapus dari daftar *Admin Bot*.`, { parse_mode: "HTML" });
  } catch (err) {
    console.log("Gagal kirim notifikasi ke user:", err.message);
  }
});

// === HANDLER: /tiktok ===
bot.onText(/\/tiktok (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const url = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // 2. Validasi URL sederhana
    if (!url.includes('tiktok.com')) {
        return bot.sendMessage(chatId, '⚠️ Link tidak valid. Harap masukkan link TikTok yang benar.');
    }

    let loadingMsg;
    try {
        // 3. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Sedang mendownload video TikTok...*\n\n_Harap tunggu sebentar..._`, { parse_mode: 'Markdown' });

        // 4. Panggil fungsi API
        const response = await getTikTokDownloader(url);

        // 5. Handle Gagal
        if (!response.success) {
            return await bot.editMessageText(response.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 6. Handle Sukses
        const data = response.result;
        
        // Format Caption
        const caption = `
🎵 *${data.title || 'TikTok Video'}*

👤 *Author:* ${data.author.name} (@${data.author.username})
❤️ *Like:* ${data.stats.like}
▶️ *Play:* ${data.stats.play}
↗️ *Share:* ${data.stats.share}

_Video berhasil didownload tanpa watermark._
`;

        // 7. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        
        // 8. Kirim Video
        await bot.sendVideo(chatId, data.videoUrl, {
            caption: caption,
            parse_mode: 'Markdown'
        });
        
        // (Opsional) Kirim Audio juga jika mau
        // await bot.sendAudio(chatId, data.musicUrl);

    } catch (error) {
        console.error("Handler /tiktok error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /tiktok.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /ig (Instagram) ===
bot.onText(/\/ig (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const url = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // 2. Validasi URL
    if (!url.includes('instagram.com')) {
        return bot.sendMessage(chatId, '⚠️ Link tidak valid. Harap masukkan link Instagram yang benar.');
    }

    let loadingMsg;
    try {
        // 3. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Sedang mendownload media Instagram...*\n\n_Harap tunggu..._`, { parse_mode: 'Markdown' });

        // 4. Panggil fungsi API
        const response = await getInstagramDownloader(url);

        // 5. Handle Gagal
        if (!response.success) {
            return await bot.editMessageText(response.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 6. Handle Sukses
        const mediaList = response.data; // Ini adalah array berisi URL
        
        // Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

        // Loop dan kirim setiap media yang ditemukan
        for (const mediaUrl of mediaList) {
            // Deteksi tipe file sederhana berdasarkan URL
            if (mediaUrl.includes('.mp4')) {
                await bot.sendVideo(chatId, mediaUrl, { caption: '✅ Instagram Video' });
            } else {
                await bot.sendPhoto(chatId, mediaUrl, { caption: '✅ Instagram Photo' });
            }
        }

    } catch (error) {
        console.error("Handler /ig error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /ig.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /searchimg ===
bot.onText(/\/searchimg (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari gambar:* ${query}...`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getGoogleImage(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        // Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        
        // Kirim Foto
        await bot.sendPhoto(chatId, result.imageUrl, {
            caption: `*Hasil pencarian Google untuk:* \`${query}\``,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Handler /searchimg error:", error.message);
        
        // Kirim pesan baru jika edit/kirim gagal
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat mencari gambar.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /waifu ===
bot.onText(/\/waifu/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // Tambahkan timestamp untuk "Cache Busting"
    const apiUrl = `https://api.siputzx.my.id/api/r/waifu?v=${Date.now()}`;
    let loadingMsg;

    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari gambar waifu acak...*`, { parse_mode: 'Markdown' });

        // 3. Langsung kirim URL-nya sebagai foto
        // Telegram akan mengunduh gambar dari URL tersebut
        await bot.sendPhoto(chatId, apiUrl, {
            caption: `*Gambar Waifu Acak* 😍`,
            parse_mode: 'Markdown'
        });

        // 4. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

    } catch (error) {
        console.error("Handler /waifu error:", error.message);
        
        // Kirim pesan baru jika kirim gagal
        await bot.sendMessage(chatId, '❌ Gagal mengirim gambar.\nAPI mungkin sedang down atau link-nya bermasalah.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /zodiac ===
bot.onText(/\/zodiac (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari info zodiak:* ${query}...`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getZodiacInfo(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses - Format pesannya
        const data = result.data;
        const formattedText = `
🌟 *Zodiak Anda: ${data.zodiak}*

🍀 *Nomor Keberuntungan:* \`${data.nomor_keberuntungan}\`
🌸 *Aroma Keberuntungan:* \`${data.aroma_keberuntungan}\`
🪐 *Planet:* \`${data.planet_yang_mengitari}\`
🌼 *Bunga Keberuntungan:* \`${data.bunga_keberuntungan}\`
🎨 *Warna Keberuntungan:* \`${data.warna_keberuntungan}\`
💎 *Batu Keberuntungan:* \`${data.batu_keberuntungan}\`
🌬️ *Elemen Keberuntungan:* \`${data.elemen_keberuntungan}\`
❤️ *Pasangan Zodiak:* \`${data.pasangan_zodiak}\`
`;
        // Kirimkan teks yang diformat
        await bot.editMessageText(formattedText, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Handler /zodiac error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /zodiac.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /artinama ===
bot.onText(/\/artinama (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari arti nama:* ${query}...`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getArtiNama(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        // API ini mengembalikan teks biasa, bukan Markdown
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
        });

    } catch (error) {
        console.error("Handler /artinama error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /artinama.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// TOOLS MENU
bot.onText(/\/iqc (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Harap masukkan teks terlebih dahulu!\nContoh: /iqc Halo Dunia");
  }
  const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=11%3A26&messageText=${encodeURIComponent(text)}&carrierName=INDOSAT%20OOREDOO&batteryPercentage=88&signalStrength=4&emojiStyle=apple`;
  await bot.sendMessage(chatId, "⏳ Sedang memproses gambar...");
  try {
    await bot.sendPhoto(chatId, apiUrl, {
      caption: "✨ Hasil generate image",
    });
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses gambar.");
  }
});

bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
    
  const argsRaw = match[1];

  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Format: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '⏳ ᴍᴇᴍʙᴜᴀᴛ sᴛɪᴄᴋᴇʀ ʙʀᴀᴛ...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});


// ============================================================
// MODIFIED CASE: INSTALL PANEL (REPLACEMENT)
// ============================================================

// Helper function untuk random password (diperlukan oleh script baru)
function generateRandomPassword(length = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

bot.onText(/^(\.|\#|\/)installpanel$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /installpanel ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @sipicung`);
});

bot.onText(/\/installpanel (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = match[1];
    
    // Validasi Admin menggunakan fungsi yang ada di index.js
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, 'Fitur Ini Khusus Owner/Admin Saya!!!');
    }

    const t = text.split(',');
    if (t.length < 5) {
        return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /installpanel ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @sipicung');
    }

    const ipvps = t[0].trim();
    const passwd = t[1].trim();
    const subdomain = t[2].trim();
    const domainnode = t[3].trim();
    const ramvps = t[4].trim();

    const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd,
        readyTimeout: 20000 // Tambahan timeout agar tidak hang
    };

    let password = generateRandomPassword();
    const command = 'bash <(curl -s https://pterodactyl-installer.se)';
    const commandWings = 'bash <(curl -s https://pterodactyl-installer.se)';
    const conn = new Client();

    conn.on('ready', () => {
        bot.sendMessage(chatId, `PROSES PENGINSTALLAN SEDANG BERLANGSUNG MOHON TUNGGU 5-10 MENIT\nscript by @sipicung`);
        
        conn.exec(command, (err, stream) => {
            if (err) {
                bot.sendMessage(chatId, `Error Exec: ${err.message}`);
                conn.end();
                return;
            }

            stream.on('close', (code, signal) => {
                console.log(`Stream closed with code ${code} and signal ${signal}`);
                installWings(conn, domainnode, subdomain, password, ramvps);
            }).on('data', (data) => {
                handlePanelInstallationInput(data, stream, subdomain, password);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        bot.sendMessage(chatId, `Gagal Konek SSH: ${err.message}`);
    }).connect(connSettings);

    // --- NESTED FUNCTIONS UNTUK LOGIKA INSTALL ---

    async function installWings(conn, domainnode, subdomain, password, ramvps) {
        bot.sendMessage(chatId, `PROSES PENGINSTALLAN WINGS SEDANG BERLANGSUNG MOHON TUNGGU 5 MENIT\nscript by @sipicung`);
        conn.exec(commandWings, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log(`Wings installation stream closed with code ${code} and signal ${signal}`);
                createNode(conn, domainnode, ramvps, subdomain, password);
            }).on('data', (data) => {
                handleWingsInstallationInput(data, stream, domainnode, subdomain);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }

    async function createNode(conn, domainnode, ramvps, subdomain, password) {
        const command = 'bash <(curl https://raw.githubusercontent.com/RuztanHosting/RuzPrivat/main/install.sh)';
        bot.sendMessage(chatId, `MEMULAI CREATE NODE & LOCATION\nscript by @sipicung`);
        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log(`Node creation stream closed with code ${code} and ${signal} signal`);
                conn.end();
                sendPanelData(subdomain, password);
            }).on('data', (data) => {
                handleNodeCreationInput(data, stream, domainnode, ramvps);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }

    function sendPanelData(subdomain, password) {
        bot.sendMessage(chatId, `DATA PANEL ANDA\n\n🟢 USERNAME: admin\n🟢 PASSWORD: ${password}\n🟢 LOGIN: ${subdomain}\n\nNote: Semua Instalasi Telah Selesai Silahkan Simpan Data Admin Dengan Baik \nNote: Jika Data Hilang Maka Admin Tidak Bertanggung Jawab\nscript by @sipicung`);
    }

    function handlePanelInstallationInput(data, stream, subdomain, password) {
        const str = data.toString();
        if (str.includes('Input')) stream.write('0\n');
        if (str.includes('Input')) stream.write('\n');
        if (str.includes('Input')) stream.write('\n');
        if (str.includes('Input')) stream.write('1248\n');
        if (str.includes('Input')) stream.write('Asia/Jakarta\n');
        if (str.includes('Input')) stream.write('admin@gmail.com\n');
        if (str.includes('Input')) stream.write('admin@gmail.com\n');
        if (str.includes('Input')) stream.write('admin\n');
        if (str.includes('Input')) stream.write('adm\n');
        if (str.includes('Input')) stream.write('adm\n');
        if (str.includes('Input')) stream.write(`${password}\n`);
        if (str.includes('Input')) stream.write(`${subdomain}\n`);
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('yes\n');
        if (str.includes('Please read the Terms of Service')) stream.write('Y\n');
        if (str.includes('Input')) stream.write('\n');
        if (str.includes('Input')) stream.write('1\n');
        console.log('STDOUT Panel: ' + str);
    }

    function handleWingsInstallationInput(data, stream, domainnode, subdomain) {
        const str = data.toString();
        if (str.includes('Input')) stream.write('1\n');
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write(`${subdomain}\n`);
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('user\n');
        if (str.includes('Input')) stream.write('1248\n');
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write(`${domainnode}\n`);
        if (str.includes('Input')) stream.write('y\n');
        if (str.includes('Input')) stream.write('admin@gmail.com\n');
        if (str.includes('Input')) stream.write('y\n');
        console.log('STDOUT Wings: ' + str);
    }

    function handleNodeCreationInput(data, stream, domainnode, ramvps) {
        stream.write('RuztanXD\n'); // Jangan diubah sesuai request
        stream.write('4\n');
        stream.write('LOCATION\n');
        stream.write('Jangan Lupa Sholat\n');
        stream.write(`${domainnode}\n`);
        stream.write('NODES\n');
        stream.write(`${ramvps}\n`);
        stream.write(`${ramvps}\n`);
        stream.write('1\n');
        console.log('STDOUT Node: ' + data.toString());
    }
});

// ============================================================
// MODIFIED CASE: SWINGS (REPLACEMENT)
// ============================================================

bot.onText(/^(\.|\#|\/)swings$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /swings ipvps,password,token\nOWNER @sipicung`);
});

bot.onText(/^\/uninstallpanel(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const senderId = msg.from.id;
  
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /uninstallpanel ip|password");
  }

   if (!isAdmin(senderId))
    return bot.sendMessage(senderId, "❌ Kamu tidak punya izin menghapus admin.");
   
  const [ip, password] = text.split("|");
  if (!ip || !password) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /uninstallpanel ip|password", { parse_mode: "Markdown" });
  }

  const conn = new Client();
  const random = Math.floor(1000 + Math.random() * 9000);

  bot.sendMessage(chatId, `
📡 ᴍᴇɴɢʜᴜʙᴜɴɢᴋᴀɴ ᴋᴇ ᴠᴘꜱ *${ip}*
ꜱɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ 10-20 ᴍᴇɴɪᴛ...`, { parse_mode: "Markdown" });

  conn.on("ready", () => {
    conn.exec("bash <(curl -s https://pterodactyl-installer.se)", (err, stream) => {
      if (err) {
        conn.end();
        return bot.sendMessage(chatId, "❌ Gagal menjalankan installer.");
      }

      stream.on("close", (code) => {
        conn.end();
        if (code === 0) {
          bot.sendMessage(chatId, `
✅ *ꜱᴜᴋꜱᴇꜱ ᴜɴɪɴꜱᴛᴀʟʟ ᴘᴀɴᴇʟ!*
`, { parse_mode: "Markdown" });
        } else {
          bot.sendMessage(chatId, `⚠️ ɪɴꜱᴛᴀʟʟᴇʀ ꜱᴇʟᴇꜱᴀɪ ᴅᴇɴɢᴀɴ ᴋᴏᴅᴇ ${code}. ʙᴇʙᴇʀᴀᴘᴀ ᴍᴜɴɢᴋɪɴ ɢᴀɢᴀʟ. ᴄᴇᴋ ᴍᴀɴᴜᴀʟ ᴠᴘꜱ.`);
        }
      });

      stream.on("data", (data) => {
        const out = data.toString();
        console.log("INSTALL >>", out);

        if (out.includes("Input 0-6")) stream.write("6\n");
        if (out.includes("Do you want to remove panel? (y/N)")) stream.write("y\n");
        if (out.includes("Do you want to remove Wings (daemon)? (y/N)")) stream.write("y\n");
        if (out.includes("Continue with uninstallation? (y/N)")) stream.write("y\n");
        if (out.includes("Choose the panel database (to skip don't input anything)")) stream.write("\n");
        if (out.includes("Database called panel has been detected. Is it the pterodactyl database? (y/N)")) stream.write("y\n");
        if (out.includes("User called pterodactyl has been detected. Is it the pterodactyl user? (y/N)")) stream.write("y\n");
      });

      stream.stderr.on("data", (data) => {
        console.error("STDERR:", data.toString());
      });
    });
  }).on("error", (err) => {
    bot.sendMessage(chatId, `❌ Gagal konek ke VPS:\n${err.message}`);
  }).connect({
    host: ip,
    port: 22,
    username: "root",
    password: password,
    readyTimeout: 20000
  });
});

// === HANDLER: /setprice (Hanya Super Admin) ===
bot.onText(/\/setprice (\d+) (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // 1. Hanya Super Admin (Anda) yang bisa set harga
    if (String(senderId) !== String(owner)) {
        return bot.sendMessage(chatId, '❌ Perintah ini hanya untuk Super Admin (Owner Utama).');
    }

    const newPrice = parseInt(match[1], 10);
    const newDuration = parseInt(match[2], 10);

    if (isNaN(newPrice) || newPrice <= 0 || isNaN(newDuration) || newDuration <= 0) {
        return bot.sendMessage(chatId, '⚠️ Format salah. Gunakan:\n`/setprice [harga] [hari]`\n\nContoh:\n`/setprice 10000 30`', { parse_mode: 'Markdown' });
    }

    // 2. Update harga di memori
    setting.ADMIN_PRICE = newPrice;
    setting.ADMIN_DURATION = newDuration;

    // 3. Simpan perubahan ke file setting.js
    try {
        const configPath = path.join(__dirname, "setting.js");
        // Kita perlu mem-format ulang seluruh file setting agar rapi
        const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
        fs.writeFileSync(configPath, updatedConfig, "utf8");

        await bot.sendMessage(chatId, `✅ Harga admin berhasil diubah:\n*Rp${newPrice}* untuk *${newDuration} hari*\\.`, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        console.error("Gagal menyimpan setting.js:", error);
        await bot.sendMessage(chatId, '❌ Gagal menyimpan harga baru ke file `setting.js`.');
    }
});
// === MODIFIKASI: Ganti /listadmin menjadi /listsewa ===
bot.onText(/\/listsewa/, async (msg) => {
  const userId = msg.from.id;
  
  // 1. PERBAIKAN: Cek jika dia Owner
  if (!isOwner(userId))
    return bot.sendMessage(userId, "❌ Hanya Owner yang bisa melihat daftar sewa.");

  if (!setting.ADMIN_IDS.length)
    return bot.sendMessage(userId, "📭 Belum ada admin sewa yang terdaftar.");

  let text = "👑 <b>Daftar Admin Sewa Aktif:</b>\n";
  let hasAdmins = false;
  
  for (const adminObj of setting.ADMIN_IDS) {
    // Jangan tampilkan Super Admin di daftar sewa
    if (String(adminObj.id) === String(owner)) continue;
    
    hasAdmins = true; // Tandai bahwa kita menemukan admin sewa/owner
    let expiryInfo = "";
    
    if (adminObj.expiresAt === null) {
      expiryInfo = " (Permanen - Owner)"; // Ini adalah Owner yang di-add via /addowner
    } else {
      const expiryDate = new Date(adminObj.expiresAt).toLocaleString('id-ID', { 
        timeZone: 'Asia/Jakarta', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      expiryInfo = ` (Kedaluwarsa: ${expiryDate} WIB)`;
    }

    text += `• <code>${adminObj.id}</code>${expiryInfo}\n`;
  }
  
  if (!hasAdmins) {
      return bot.sendMessage(userId, "📭 Belum ada admin sewa yang terdaftar.");
  }

  await bot.sendMessage(userId, text, { parse_mode: "HTML" });
});

// === PERINTAH MANAJEMEN OWNER (Hanya Super Admin) ===

bot.onText(/\/addowner (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // HANYA Super Admin yang bisa menambah owner
    if (String(senderId) !== String(owner)) {
        return bot.sendMessage(chatId, '❌ Perintah ini hanya untuk Super Admin.');
    }

    const userIdToAdd = Number(match[1]);
    const owners = loadOwners();

    if (owners[userIdToAdd]) {
        return bot.sendMessage(chatId, `⚠️ User ID \`${userIdToAdd}\` sudah menjadi Owner.`, { parse_mode: 'Markdown' });
    }

    owners[userIdToAdd] = true; 
    saveOwners(owners);
    
    // Tambahkan juga ke ADMIN_IDS sebagai admin permanen
    if (!isAdmin(userIdToAdd)) {
        setting.ADMIN_IDS.push({ id: userIdToAdd, expiresAt: null });
        const configPath = path.join(__dirname, "setting.js");
        const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
        fs.writeFileSync(configPath, updatedConfig, "utf8");
    }
    
    bot.sendMessage(chatId, `✅ User ID \`${userIdToAdd}\` berhasil ditambahkan sebagai *Owner*.`, { parse_mode: 'Markdown' });
});

bot.onText(/\/delowner (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // HANYA Super Admin yang bisa menghapus owner
    if (String(senderId) !== String(owner)) {
        return bot.sendMessage(chatId, '❌ Perintah ini hanya untuk Super Admin.');
    }

    const userIdToRemove = Number(match[1]);
    const owners = loadOwners();

    if (String(userIdToRemove) === String(owner)) {
         return bot.sendMessage(chatId, '❌ Anda tidak bisa menghapus Super Admin.');
    }

    if (!owners[userIdToRemove]) {
        return bot.sendMessage(chatId, `⚠️ User ID \`${userIdToRemove}\` tidak ditemukan di daftar Owner.`, { parse_mode: 'Markdown' });
    }

    delete owners[userIdToRemove];
    saveOwners(owners);
    
    // Hapus juga dari daftar admin (jika ada)
    setting.ADMIN_IDS = setting.ADMIN_IDS.filter(admin => admin.id !== userIdToRemove);
    const configPath = path.join(__dirname, "setting.js");
    const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
    fs.writeFileSync(configPath, updatedConfig, "utf8");

    bot.sendMessage(chatId, `✅ User ID \`${userIdToRemove}\` berhasil dihapus dari *Owner* (dan daftar admin).`, { parse_mode: 'Markdown' });
});

bot.onText(/\/listowner/, (msg) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // HANYA Super Admin yang bisa melihat daftar owner
    if (String(senderId) !== String(owner)) {
        return bot.sendMessage(chatId, '❌ Perintah ini hanya untuk Super Admin.');
    }

    const owners = loadOwners();
    const entries = Object.keys(owners);

    if (entries.length === 0) {
        return bot.sendMessage(chatId, '📭 Tidak ada user yang terdaftar sebagai Owner.');
    }
    
    const list = entries.map((id, index) => {
        return `${index + 1}. \`${id}\``;
    }).join('\n');
    
    bot.sendMessage(chatId, `📋 *Daftar Owner (Reseller):*\n\n${list}`, {
        parse_mode: 'Markdown'
    });
});

// === HANDLER: /sniffdomain (Perbaikan MESSAGE_TOO_LONG) ===
bot.onText(/\/sniffdomain (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1]; // domain

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari Subdomain untuk:* ${query}...\n\n_Ini mungkin butuh waktu hingga 1 menit._`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getDomainSniffer(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses - Pangkas jika terlalu panjang
        let resultText = result.result;
        
        // === PERBAIKAN: Ubah dari 4000 ke 3900 agar aman ===
        if (resultText.length > 3900) {
            resultText = resultText.substring(0, 3900) + "\n\n... (Hasil terlalu panjang, hanya 3900 karakter pertama ditampilkan)";
        }
        // === AKHIR PERBAIKAN ===
        
        const formattedResult = "```\n" + resultText + "\n```";
        
        await bot.editMessageText(`*Subdomain Ditemukan untuk: ${query}* 🕵️‍♂️\n\n${formattedResult}`, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Handler /sniffdomain error:", error.message);
        
        // Tangani jika error-nya adalah MESSAGE_TOO_LONG
        if (error.message.includes('MESSAGE_TOO_LONG')) {
             await bot.editMessageText(`❌ *Gagal: Hasil Terlalu Panjang*\n\nDaftar subdomain untuk *${query}* terlalu besar untuk ditampilkan di Telegram.`, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        } else {
            // Error lain
            await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /sniffdomain.');
            if (loadingMsg) {
                try {
                    await bot.deleteMessage(chatId, loadingMsg.message_id);
                } catch(e) { /* abaikan */ }
            }
        }
    }
});

// === HANDLER: /stalkig ===
bot.onText(/\/stalkig (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Stalking Instagram user:* ${query}...`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getStalkIG(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses - Format pesannya
        const data = result.data;
        
        // Fungsi helper kecil untuk format angka
        const formatCount = (count) => count.toLocaleString('id-ID');

        const caption = `
*Stalk @${data.username}* 📸

*Nama:* ${data.full_name}
*Followers:* ${formatCount(data.followers_count)}
*Following:* ${formatCount(data.following_count)}
*Postingan:* ${formatCount(data.posts_count)}

*Private:* ${data.is_private ? '✅' : '❌'}
*Verified:* ${data.is_verified ? '✅' : '❌'}

*Bio:*
${data.biography || '(Tidak ada bio)'}
`;
        
        // 6. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

        // 7. Kirim Foto Profil dengan Caption
        await bot.sendPhoto(chatId, data.profile_pic_url, {
            caption: caption,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Handler /stalkig error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /stalkig.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /fakedata ===
// Bisa /fakedata (default 1) atau /fakedata 5 (custom)
bot.onText(/\/fakedata(?: (\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    // Ambil angka, jika tidak ada, default ke 1
    const count = match[1] ? parseInt(match[1], 10) : 1; 

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    if (count > 10) {
        return bot.sendMessage(chatId, '❌ Anda hanya bisa meminta maksimal 10 data sekaligus.');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Membuat ${count} data palsu...*`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getFakeData(count);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses - Format pesannya
        let formattedText = `*Hasil Generate ${result.data.length} Data Palsu* 🧑‍💻\n`;
        
        for (const person of result.data) {
            // Format tanggal lahir
            const birthDate = new Date(person.birthDate).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            formattedText += `
-----------------------------------
*Nama:* ${person.name}
*Gender:* ${person.gender}
*Tgl Lahir:* ${birthDate}
*Email:* \`${person.email}\`
*Telepon:* \`${person.phone}\`
`;
        }
        
        // Kirim hasil (Edit pesan loading)
        // Kita tidak kirim foto agar bisa menampilkan banyak data sekaligus
        await bot.editMessageText(formattedText, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Handler /fakedata error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /fakedata.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /dns (Format Output Baru) ===
bot.onText(/\/dns (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1]; // domain

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari DNS (A Record) untuk:* ${query}...`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getDnsLookup(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses - Format output baru
        const data = result.data;
        const formattedText = `
*Hasil DNS Lookup untuk: ${query}* 🌐

*IP Address (A):* \`${data.ip}\`
*Lokasi:* ${data.city}, ${data.region}, ${data.country}
*ISP/ORG:* ${data.isp}
`;
        
        await bot.editMessageText(formattedText, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Handler /dns error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /dns.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /id_jp (Translate ID to JP) ===
bot.onText(/\/id_jp (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Menerjemahkan (ID -> JP)...*`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getTranslation(query, 'id', 'ja'); // Kode bahasa Jepang adalah 'ja'

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
        });

    } catch (error) {
        console.error("Handler /id_jp error:", error.message);
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /id_jp.');
        if (loadingMsg) {
            try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch(e) {}
        }
    }
});

// === HANDLER: /id_ru (Translate ID to RU) ===
bot.onText(/\/id_ru (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Menerjemahkan (ID -> RU)...*`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getTranslation(query, 'id', 'ru');

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
        });

    } catch (error) {
        console.error("Handler /id_ru error:", error.message);
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /id_ru.');
        if (loadingMsg) {
            try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch(e) {}
        }
    }
});

// === HANDLER: /id_en (Translate ID to EN) ===
bot.onText(/\/id_en (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Menerjemahkan (ID -> EN)...*`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getTranslation(query, 'id', 'en');

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
        });

    } catch (error) {
        console.error("Handler /id_en error:", error.message);
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /id_en.');
        if (loadingMsg) {
            try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch(e) {}
        }
    }
});

// === HANDLER: /en_id (Translate EN to ID) ===
bot.onText(/\/en_id (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Menerjemahkan (EN -> ID)...*`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getTranslation(query, 'en', 'id');

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
        });

    } catch (error) {
        console.error("Handler /en_id error:", error.message);
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /en_id.');
        if (loadingMsg) {
            try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch(e) {}
        }
    }
});

// === HANDLER: /aiv3 ===
bot.onText(/\/aiv3 (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `🧠 *AI (Meta v3) sedang memikirkan jawaban...*\n\n_Harap tunggu..._`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API
        const result = await getMetaAiResponse(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses (API mengembalikan teks biasa)
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
        });

    } catch (error) {
        console.error("Handler /aiv3 error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /aiv3.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /hd (Image Enhance) ===
bot.onText(/\/hd/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // 2. Cek apakah ini balasan (reply)
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Perintah ini harus digunakan dengan me-reply (membalas) sebuah *gambar*.');
    }

    // 3. Cek apakah yang di-reply adalah foto
    if (!msg.reply_to_message.photo) {
        return bot.sendMessage(chatId, '❌ Anda hanya bisa me-reply *gambar*, bukan stiker atau teks.');
    }

    let loadingMsg;
    try {
        // 4. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Memperbaiki gambar (AI Enhance)...*\n\n_Harap tunggu, proses ini bisa 10-30 detik..._`, { parse_mode: 'Markdown' });

        // 5. Ambil file link
        const photos = msg.reply_to_message.photo;
        const fileId = photos[photos.length - 1].file_id; // Ambil resolusi terbesar
        const fileLink = await bot.getFileLink(fileId);

        // 6. Panggil fungsi API
        const result = await enhanceImage(fileLink);

        // 7. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 8. Handle Sukses
        // Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        
        // Kirim Foto yang sudah di-enhance
        await bot.sendPhoto(chatId, result.imageUrl, {
            caption: `✅ *Gambar berhasil di-Enhance!*`,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error("Handler /hd error:", error.message);
        
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /hd.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /play ===
bot.onText(/\/play (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin (disesuaikan dengan script baru Anda)
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari lagu:* ${query}\n\n_Sabar Monyet, proses ini bisa 10-30 detik._`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API (YouTube)
        const result = await getYouTubeSong(query);

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        const metadata = result.data.metadata;
        const downloadUrl = result.data.downloadUrl;

        // Cek jika downloadUrl valid (tidak undefined)
        if (!downloadUrl || downloadUrl.endsWith('undefined') || !downloadUrl.includes("http")) {
             return await bot.editMessageText("❌ Gagal mendapatkan link download dari API. Coba lagi.", {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }

        // Buat caption
        const caption = `
🎵 *${metadata.title}*
🎤 Channel: \`${metadata.channel}\`
⏱️ Durasi: \`${metadata.duration}\`
        `;

        // Konversi durasi cth: 6:46 -> 406
        let durationInSeconds = 0;
        try {
            const parts = metadata.duration.split(':');
            if (parts.length === 2) { // MM:SS
                durationInSeconds = (+parts[0] * 60) + (+parts[1]);
            } else if (parts.length === 3) { // HH:MM:SS
                durationInSeconds = (+parts[0] * 3600) + (+parts[1] * 60) + (+parts[2]);
            }
        } catch (e) { /* biarkan 0 */ }
        
        // 6. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        
        // 7. Kirim Audio
        await bot.sendAudio(chatId, downloadUrl, {
            caption: caption,
            parse_mode: 'Markdown',
            title: metadata.title,
            performer: metadata.channel,
            duration: durationInSeconds,
            thumb: metadata.cover 
        });

    } catch (error) {
        console.error("Handler /play error:", error.message);
        
        // Kirim pesan baru
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /play.\n\nFile audio mungkin terlalu besar atau link download dari API-nya bermasalah. Coba lagu lain.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /hentai ===
bot.onText(/\/hentai/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // Tambahkan timestamp untuk "Cache Busting"
    const apiUrl = `https://api.nekolabs.web.id/random/waifuim/hentai?v=${Date.now()}`;
    let loadingMsg;

    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari gambar hentai acak...*`, { parse_mode: 'Markdown' });

        // 3. Langsung kirim URL-nya sebagai foto
        // Telegram akan mengunduh gambar dari URL tersebut
        await bot.sendPhoto(chatId, apiUrl, {
            caption: `*Gambar Hentai Acak* 😋`,
            parse_mode: 'Markdown'
        });

        // 4. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

    } catch (error) {
        console.error("Handler /hentai error:", error.message);
        
        // Kirim pesan baru jika kirim gagal
        await bot.sendMessage(chatId, '❌ Gagal mengirim gambar.\nAPI mungkin sedang down atau link-nya bermasalah.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /loli ===
bot.onText(/\/loli/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // Tambahkan timestamp untuk "Cache Busting"
    const apiUrl = `https://api.nekolabs.web.id/random/loli?v=${Date.now()}`;
    let loadingMsg;

    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari gambar loli acak...*`, { parse_mode: 'Markdown' });

        // 3. Langsung kirim URL-nya sebagai foto
        // Telegram akan mengunduh gambar dari URL tersebut
        await bot.sendPhoto(chatId, apiUrl, {
            caption: `*Gambar Loli Acak* 😋`,
            parse_mode: 'Markdown'
        });

        // 4. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

    } catch (error) {
        console.error("Handler /loli error:", error.message);
        
        // Kirim pesan baru jika kirim gagal
        await bot.sendMessage(chatId, '❌ Gagal mengirim gambar.\nAPI mungkin sedang down atau link-nya bermasalah.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /cosplay ===
bot.onText(/\/cosplay/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // === PERBAIKAN: Tambahkan timestamp untuk "Cache Busting" ===
    // Ini "menipu" cache Telegram agar mengunduh gambar baru setiap saat
    const apiUrl = `https://api.nekolabs.web.id/random/cosplay?v=${Date.now()}`;
    // === AKHIR PERBAIKAN ===
    
    let loadingMsg;

    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Mencari gambar cosplay acak...*`, { parse_mode: 'Markdown' });

        // 3. Langsung kirim URL-nya sebagai foto
        // Telegram akan mengunduh gambar dari URL baru yang unik
        await bot.sendPhoto(chatId, apiUrl, {
            caption: `*Gambar Cosplay Acak* 📸`,
            parse_mode: 'Markdown'
        });

        // 4. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

    } catch (error) {
        console.error("Handler /cosplay error:", error.message);
        
        // Kirim pesan baru jika kirim gagal
        await bot.sendMessage(chatId, '❌ Gagal mengirim gambar.\nAPI mungkin sedang down atau link-nya bermasalah.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /ai ===
bot.onText(/\/ai (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin (disesuaikan dengan script baru Anda)
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `🧠 *AI sedang memikirkan jawaban untuk:* "${query}"...\n\n_Harap tunggu, ini mungkin butuh 10-30 detik._`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API (gunakan userId sebagai sessionId)
        const result = await getAiResponse(query, String(userId));

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        // Kirim hasil AI. Kita tidak pakai parse_mode
        // agar karakter seperti * atau _ dari AI tidak merusak format.
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
        });

    } catch (error) {
        console.error("Handler /ai error:", error.message);
        
        // Kirim pesan baru jika edit gagal (cth: teks terlalu panjang)
        await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /ai.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /brat (Ganti ke API Anabot) ===
bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const query = match[1];

  // 1. Cek Admin
  if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
  }

  // 2. Cek jika ada teks
  if (!query) {
    return bot.sendMessage(chatId, 'Format salah. Gunakan: /brat <teks>');
  }

  let loadingMsg;
  try {
      // 3. Kirim pesan loading
      loadingMsg = await bot.sendMessage(chatId, '⏳ ᴍᴇᴍʙᴜᴀᴛ sᴛɪᴄᴋᴇʀ ʙʀᴀᴛ...');

      // 4. Buat URL API (Anabot)
      const encodedQuery = encodeURIComponent(query);
      // Tambahkan cache buster (v=timestamp)
      const apiUrl = `https://anabot.my.id/api/maker/bratGif?text=${encodedQuery}&apikey=freeApikey&v=${Date.now()}`;

      // 5. Kirim sebagai Sticker
      // Telegram akan mengunduh GIF/animasi dari URL dan mengirimnya sebagai sticker
      await bot.sendSticker(chatId, apiUrl);

      // 6. Hapus pesan loading
      await bot.deleteMessage(chatId, loadingMsg.message_id);

  } catch (error) {
      console.error('Handler /brat error:', error.message);
      
      // Kirim pesan baru jika kirim gagal
      await bot.sendMessage(chatId, '❌ Gagal membuat stiker.\nAPI mungkin sedang down atau link-nya bermasalah.');
      
      if (loadingMsg) {
          try {
              await bot.deleteMessage(chatId, loadingMsg.message_id);
          } catch(e) { /* abaikan */ }
      }
  }
});

// === HANDLER: /qc (Quote Chat) ===
bot.onText(/\/qc/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // 1. Cek Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // 2. Cek apakah ini balasan (reply)
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Perintah ini harus digunakan dengan me-reply (membalas) sebuah pesan teks.');
    }

    // 3. Cek apakah yang di-reply adalah teks
    if (!msg.reply_to_message.text) {
        return bot.sendMessage(chatId, '❌ Anda hanya bisa me-reply pesan teks.');
    }

    // 4. Ambil data dari pesan yang di-reply
    const repliedMsg = msg.reply_to_message;
    const textToQuote = repliedMsg.text;
    const userName = repliedMsg.from.first_name || 'Pengguna';
    const userToQuoteId = repliedMsg.from.id;

    let loadingMsg;
    try {
        // 5. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `⏳ *Membuat stiker quote...*`, { parse_mode: 'Markdown' });

        // 6. Dapatkan URL foto profil (PFP)
        let pfpUrl = 'https://i.pinimg.com/736x/ea/e3/2f/eae32ff3ef8962a8618349edf0082eb8.jpg'; // Default PFP
        try {
            const userPhotos = await bot.getUserProfilePhotos(userToQuoteId, { limit: 1 });
            if (userPhotos.total_count > 0) {
                const fileId = userPhotos.photos[0][0].file_id; // Ambil foto resolusi terkecil
                pfpUrl = await bot.getFileLink(fileId);
            }
        } catch (e) {
            console.error("Gagal mendapatkan PFP, menggunakan default:", e.message);
        }

        // 7. Buat URL API
        const encodedText = encodeURIComponent(textToQuote);
        const encodedName = encodeURIComponent(userName);
        const encodedImage = encodeURIComponent(pfpUrl);
        
        const apiUrl = `https://anabot.my.id/api/maker/qc?text=${encodedText}&image=${encodedImage}&name=${encodedName}&apikey=freeApikey&v=${Date.now()}`;

        // 8. Kirim sebagai Sticker
        await bot.sendSticker(chatId, apiUrl);

        // 9. Hapus pesan loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);

    } catch (error) {
        console.error("Handler /qc error:", error.message);
        
        // Kirim pesan baru jika kirim gagal
        await bot.sendMessage(chatId, '❌ Gagal membuat stiker.\nAPI mungkin sedang down atau link-nya bermasalah.');
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

// === HANDLER: /aiv2 ===
bot.onText(/\/aiv2 (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const query = match[1];

    // 1. Cek Admin (disesuaikan dengan script baru Anda)
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Membeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    let loadingMsg;
    try {
        // 2. Kirim pesan loading
        loadingMsg = await bot.sendMessage(chatId, `🧠 *AI (v2) sedang memikirkan jawaban untuk:* "${query}"...\n\n_Harap tunggu, ini mungkin butuh 10-30 detik._`, { parse_mode: 'Markdown' });

        // 3. Panggil fungsi API (gunakan userId sebagai sessionId)
        const result = await getAiV2Response(query, String(userId));

        // 4. Handle Gagal
        if (!result.success) {
            return await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: loadingMsg.message_id,
                parse_mode: 'Markdown'
            });
        }
        
        // 5. Handle Sukses
        // API ini mengembalikan Markdown (sesuai contoh Anda), jadi kita set parse_mode
        await bot.editMessageText(result.result, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'Markdown' 
        });

    } catch (error) {
        console.error("Handler /aiv2 error:", error.message);
        
        // Kirim pesan baru jika edit gagal (cth: teks terlalu panjang/format salah)
        if (error.response && error.response.data && error.response.data.description) {
             // Jika error dari Telegram (misal: Markdown salah format)
             await bot.sendMessage(chatId, `❌ Gagal menampilkan respons AI (v2):\n${error.response.data.description}`);
        } else {
             await bot.sendMessage(chatId, '❌ Terjadi kesalahan internal saat memproses /aiv2.');
        }
        
        if (loadingMsg) {
            try {
                await bot.deleteMessage(chatId, loadingMsg.message_id);
            } catch(e) { /* abaikan */ }
        }
    }
});

bot.onText(/\/swings (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = match[1];

    // Validasi Admin
    if (!isAdmin(userId)) {
        return bot.sendMessage(chatId, 'Fitur Ini Khusus Owner/Admin Saya!!!');
    }

    const t = text.split(',');
    if (t.length < 3) {
        return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /swings ipvps,password,token\nOWNER @sipicung');
    }

    const ipvps = t[0].trim();
    const passwd = t[1].trim();
    const token = t[2].trim();

    const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd,
        readyTimeout: 20000
    };

    const conn = new Client();
    const command = 'bash <(curl https://raw.githubusercontent.com/RuztanHosting/RuzPrivat/main/install.sh)';

    conn.on('ready', () => {
        bot.sendMessage(chatId, ' PROSES CONFIGURE WINGS\nscript by @sipicung');

        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log(`Stream closed with code ${code} and ${signal} signal`);
                bot.sendMessage(chatId, 'SUCCES START WINGS DI PANEL ANDA COBA CEK PASTI IJO😁\nscript by @sipicung');
                conn.end();
            }).on('data', (data) => {
                stream.write('RuztanXD\n');
                stream.write('3\n');
                stream.write(`${token}\n`);
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        console.log('Connection Error: ' + err);
        bot.sendMessage(chatId, 'Katasandi atau IP tidak valid / Gagal Konek SSH');
    }).connect(connSettings);
});

bot.onText(/^\/subdo(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
     const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    const text = match[1];
    if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /subdo reqname|ipvps");
    }
    
    if (!text.includes("|")) return bot.sendMessage(chatId, "❌ Format salah!\nContoh: `/subdo reqname|ipvps`", { parse_mode: "Markdown" });

    const [host, ip] = text.split("|").map(i => i.trim());
    const dom = Object.keys(global.subdomain);

    if (dom.length === 0) return bot.sendMessage(chatId, "❌ Tidak ada domain yang tersedia saat ini.");

    const inlineKeyboard = [];
    for (let i = 0; i < dom.length; i += 2) {
        const row = dom.slice(i, i + 2).map((d, index) => ({
            text: d,
            callback_data: `create_domain ${i + index} ${host}|${ip}`
        }));
        inlineKeyboard.push(row);
    }

    const opts = {
        reply_markup: {
            inline_keyboard: inlineKeyboard
        }
    };

    bot.sendMessage(chatId, `🔹 *Subdomain yang tersedia saat ini*\nbig thanks from @sipicung\nᴄʜᴏᴏꜱᴇ ᴀ ꜱᴜʙᴅᴏᴍᴀɪɴ :`, { parse_mode: "Markdown", ...opts });
});

// handler subdomain
bot.on("callback_query", async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data.split(" ");

    if (data[0] === "create_domain") {
        /*if (callbackQuery.from.id !== ownerId) {
            return bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Owner only!", show_alert: true });
        }*/

        const domainIndex = Number(data[1]);
        const dom = Object.keys(global.subdomain);

        if (domainIndex < 0 || domainIndex >= dom.length) return bot.sendMessage(msg.chat.id, "Domain tidak ditemukan!");
        if (!data[2] || !data[2].includes("|")) return bot.sendMessage(msg.chat.id, "Hostname/IP tidak ditemukan!");

        const tldnya = dom[domainIndex];
        const [host, ip] = data[2].split("|").map(item => item.trim());

        async function createSubDomain(host, ip) {
            try {
                const response = await axios.post(
                    `https://api.cloudflare.com/client/v4/zones/${global.subdomain[tldnya].zone}/dns_records`,
                    {
                        type: "A",
                        name: `${host.replace(/[^a-z0-9.-]/gi, "")}.${tldnya}`,
                        content: ip.replace(/[^0-9.]/gi, ""),
                        ttl: 1,
                        proxied: false
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${global.subdomain[tldnya].apitoken}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const res = response.data;
                if (res.success) {
                    return {
                        success: true,
                        name: res.result?.name || `${host}.${tldnya}`,
                        ip: res.result?.content || ip
                    };
                } else {
                    return { success: false, error: "Gagal membuat subdomain" };
                }
            } catch (e) {
                const errorMsg = e.response?.data?.errors?.[0]?.message || e.message || "Terjadi kesalahan";
                return { success: false, error: errorMsg };
            }
        }

        const result = await createSubDomain(host.toLowerCase(), ip);

        if (result.success) {
            let teks = `
✅ *ʙᴇʀʜᴀsɪʟ ᴍᴇᴍʙᴜᴀᴛ sᴜʙᴅᴏᴍᴀɪɴ*

🌐 *sᴜʙᴅᴏᴍᴀɪɴ:* \`${result.name}\`
📌 *ɪᴘ ᴠᴘs:* \`${result.ip}\`
`;
            await bot.sendMessage(msg.chat.id, teks, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(msg.chat.id, `❌ Gagal membuat subdomain:\n${result.error}`);
        }

        bot.answerCallbackQuery(callbackQuery.id);
    }
});
    
bot.onText(/^\/listsubdo$/, async (msg) => {
  const chatId = msg.chat.id;
    const userId = msg.from.id;
     const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

  const dom = Object.keys(global.subdomain);
  if (dom.length === 0) {
    return bot.sendMessage(chatId, "❌ Tidak ada domain yang tersedia saat ini.");
  }

  let teks = `📜 *ᴅᴀꜰᴛᴀʀ ᴅᴏᴍᴀɪɴ ʏᴀɴɢ ᴛᴇʀꜱᴇᴅɪᴀ*\n\n`;
  dom.forEach((d, i) => {
    teks += `${i + 1}. \`${d}\`\n`;
  });

  bot.sendMessage(chatId, teks, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
});

bot.onText(/^\/hbpanel(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }
  let text = match[1];
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /hbpanel ipvps|pwvps");
  }
    
  let t = text.split("|");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh:\n/hbpanel ipvps|pwvps");
  }

  let ipvps = t[0].trim();
  let passwd = t[1].trim();

  await bot.sendMessage(chatId, "⏳ ᴘʀᴏꜱᴇꜱ ʜᴀᴄᴋʙᴀᴄᴋ ᴘᴀɴᴇʟ...");

  let newuser = "admin" + Math.floor(Math.random() * 9999).toString();
  let newpw = "admin" + Math.floor(Math.random() * 9999).toString();

  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd
  };

  const command = `bash <(curl -s https://raw.githubusercontent.com/Bangsano/Autoinstaller-Theme-Pterodactyl/refs/heads/main/install.sh)`;
  const conn = new Client();

  conn.on("ready", () => {
    conn.exec(command, (err, stream) => {
      if (err) throw err;

      stream.on("close", async () => {
        let teks = `
*ʜᴀᴄᴋʙᴀᴄᴋ ᴘᴀɴᴇʟ ꜱᴜᴋꜱᴇꜱ ✅*

*ᴅᴇᴛᴀɪʟ ᴀᴋᴜɴ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ:*
👤 ᴜꜱᴇʀɴᴀᴍᴇ: \`${newuser}\`
🔑 ᴘᴀꜱꜱᴡᴏʀᴅ: \`${newpw}\`
`;
        await bot.sendMessage(chatId, teks, { parse_mode: "Markdown" });
        conn.end();
      }).on("data", (data) => {
        console.log("STDOUT:", data.toString());
      }).stderr.on("data", (data) => {
        console.log("STDERR:", data.toString());
        stream.write("7\n");
        stream.write(`${newuser}\n`);
        stream.write(`${newpw}\n`);
      });
    });
  }).on("error", (err) => {
    console.log("Connection Error:", err);
    bot.sendMessage(chatId, "❌ ᴋᴀᴛᴀꜱᴀɴᴅɪ ᴀᴛᴀᴜ ɪᴘ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ");
  }).connect(connSettings);
});
    
// command /setpwvps
bot.onText(/^\/setpwvps(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }
  let text = match[1];
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /setpwvps ipvps|password_lama|password_baru");
  }
    
  let t = text.split("|");
  if (t.length < 3) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh:\n/setpwvps ipvps|password_lama|password_baru");
  }

  let ipvps = t[0].trim();
  let passwd = t[1].trim();
  let newpw = t[2].trim();

  await bot.sendMessage(chatId, "⏳  ꜱᴇᴅᴀɴɢ ᴘʀᴏꜱᴇꜱ...");

  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd
  };

  const command = `bash <(curl -s https://raw.githubusercontent.com/Bangsano/Autoinstaller-Theme-Pterodactyl/refs/heads/main/install.sh)`;
  const conn = new Client();

  conn.on("ready", () => {
    conn.exec(command, (err, stream) => {
      if (err) throw err;

      stream.on("close", async () => {
        conn.end();
      }).on("data", (data) => {
        console.log("STDOUT:", data.toString());
      }).stderr.on("data", (data) => {
        console.log("STDERR:", data.toString());
        stream.write("8\n");
        stream.write(`${newpw}\n`);
        stream.write(`${newpw}\n`);
      });
    });
  }).on("error", (err) => {
    console.log("Connection Error:", err);
    bot.sendMessage(chatId, "❌ ᴋᴀᴛᴀꜱᴀɴᴅɪ ᴀᴛᴀᴜ ɪᴘ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ");
  }).connect(connSettings);
    
    let teks = `
*ꜱᴜᴋꜱᴇꜱ ɢᴀɴᴛɪ ᴘᴀꜱꜱᴡᴏʀᴅ ✅*

*ᴅᴇᴛᴀɪʟ ᴘᴀꜱꜱᴡᴏʀᴅ:*
📌 ɪᴘ ᴠᴘꜱ: \`${ipvps}\`
🔑 ᴘᴀꜱꜱᴡᴏʀᴅ: \`${newpw}\`
`;
        await bot.sendMessage(chatId, teks, { parse_mode: "Markdown" });
});
  // ─── /installprotect1 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect1 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
     const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect1 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect1 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect2 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect2 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;
    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect2 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect2 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut2.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 2...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect3 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect3 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }
    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect3 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect3 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut3.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 3...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect4 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect4 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect4 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect4 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut4.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 4...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect5 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect5 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect5 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect5 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut5.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 5...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect6 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect6 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect6 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect6 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut6.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 6...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect7 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect7 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;

    // Validasi premium

    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect7 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect7 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut7.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 7...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect8 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect8 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect8 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect8 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut8.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 8...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /installprotect9 (versi SSH2) ────────────────────
  bot.onText(/^\/installprotect9 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
    const senderId = msg.from.id;

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect9 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotect9 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/mbut9.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 9...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *Instalasi selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
// ─── /installprotectall (versi SSH2) ────────────────────
bot.onText(/^\/installprotectall (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const senderId = msg.from.id;
  const input = match[1];

  // Validasi premium
  if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

  // Validasi format input
  if (!input.includes('|')) {
    return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotectall ipvps|pwvps`', { parse_mode: 'Markdown' });
  }

  const [ipvps, pwvps] = input.split('|').map(i => i.trim());
  if (!ipvps || !pwvps) {
    return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/installprotectall ipvps|pwvps`', { parse_mode: 'Markdown' });
  }

  const conn = new Client();
  const scripts = [
    'mbut.sh',
    'mbut2.sh',
    'mbut3.sh',
    'mbut4.sh',
    'mbut5.sh',
    'mbut6.sh',
    'mbut7.sh',
    'mbut8.sh',
    'mbut9.sh'
  ];

  bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai instalasi Protect Panel 1-9...`, { parse_mode: 'Markdown' });

  conn.on('ready', async () => {
    bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses instalasi semua Protect Panel sedang berjalan...');

    for (let i = 0; i < scripts.length; i++) {
      const scriptURL = `https://raw.githubusercontent.com/antirusuhnihdeks/mbut/main/${scripts[i]}`;
      bot.sendMessage(chatId, `🚀 Memulai instalasi *${scripts[i]}*...`, { parse_mode: 'Markdown' });

      await new Promise((resolve) => {
        conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
          if (err) {
            bot.sendMessage(chatId, `❌ Gagal mengeksekusi ${scripts[i]}:\n\`${err.message}\``, { parse_mode: 'Markdown' });
            return resolve();
          }

          let output = '';

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            output += `\n[ERROR] ${data.toString()}`;
          });

          stream.on('close', () => {
            const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
            bot.sendMessage(chatId, `✅ *${scripts[i]} selesai!*\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, { parse_mode: 'Markdown' });
            resolve();
          });
        });
      });
    }

    conn.end();
    bot.sendMessage(chatId, '🎉 Semua instalasi Protect Panel 1-9 selesai!', { parse_mode: 'Markdown' });
  });

  conn.on('error', (err) => {
    bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, { parse_mode: 'Markdown' });
  });

  conn.connect({
    host: ipvps,
    port: 22,
    username: 'root',
    password: pwvps
  });
 });
  // ─── /uninstallprotect1 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect1 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect1 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect1 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect1.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 1 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 1 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect2 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect2 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect2 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect2 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect2.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai uninstall Protect 2 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 2 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect3 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect3 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect3 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect3 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect3.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 3 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 3 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect4 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect4 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect4 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect4 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect4.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 4 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 4 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect5 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect5 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect5 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect5 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect5.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 5 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 5 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect6 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect6 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect6 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect6 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect6.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 6 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 6 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect7 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect7 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect7 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect7 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect7.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 7 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 7 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect8 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect8 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect8 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect8 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect8.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 8 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 8 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
  // ─── /uninstallprotect9 (versi SSH2) ────────────────────
  bot.onText(/^\/uninstallprotect9 (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];

    // Validasi premium


    // Validasi format input
    if (!input.includes('|')) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect9 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const [ipvps, pwvps] = input.split('|').map(i => i.trim());
    if (!ipvps || !pwvps) {
      return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotect9 ipvps|pwvps`', { parse_mode: 'Markdown' });
    }

    const conn = new Client();
    const scriptURL = 'https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/uninstallprotect9.sh';

    bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect 9 Panel...`, { parse_mode: 'Markdown' });

    conn.on('ready', () => {
      bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses Uninstall sedang berjalan...');

      // Jalankan skrip install via SSH
      conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
        if (err) {
          conn.end();
          return bot.sendMessage(chatId, `❌ Gagal mengeksekusi perintah:\n\`${err.message}\``, { parse_mode: 'Markdown' });
        }

        let output = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += `\n[ERROR] ${data.toString()}`;
        });

        stream.on('close', () => {
          conn.end();

          const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
          bot.sendMessage(chatId, `✅ *uninstall protect 9 selesai!*\n\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, {
            parse_mode: 'Markdown'
          });
        });
      });
    });

    conn.on('error', (err) => {
      bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, {
        parse_mode: 'Markdown'
      });
    });

    conn.connect({
      host: ipvps,
      port: 22,
      username: 'root',
      password: pwvps
    });
  });
// ─── /uninstallprotectall (versi SSH2) ────────────────────
bot.onText(/^\/uninstallprotectall (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const input = match[1];

  // Validasi premium
  if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyakses');
    }

  // Validasi format input
  if (!input.includes('|')) {
    return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotectall ipvps|pwvps`', { parse_mode: 'Markdown' });
  }

  const [ipvps, pwvps] = input.split('|').map(i => i.trim());
  if (!ipvps || !pwvps) {
    return bot.sendMessage(chatId, '❌ Salah format!\nGunakan seperti ini:\n`/uninstallprotectall ipvps|pwvps`', { parse_mode: 'Markdown' });
  }

  const conn = new Client();
  const scripts = [
    'uninstallprotect1.sh',
    'uninstallprotect2.sh',
    'uninstallprotect3.sh',
    'uninstallprotect4.sh',
    'uninstallprotect5.sh',
    'uninstallprotect6.sh',
    'uninstallprotect7.sh',
    'uninstallprotect8.sh',
    'uninstallprotect9.sh'
  ];

  bot.sendMessage(chatId, `⏳ Menghubungkan ke VPS *${ipvps}* dan mulai Uninstall Protect Panel 1-9...`, { parse_mode: 'Markdown' });

  conn.on('ready', async () => {
    bot.sendMessage(chatId, '⚙️ Koneksi berhasil! Proses uninstall semua Protect Panel sedang berjalan...');

    for (let i = 0; i < scripts.length; i++) {
      const scriptURL = `https://raw.githubusercontent.com/lightsecret/uninstallprotectpanel/main/${scripts[i]}`;
      bot.sendMessage(chatId, `🚀 Memulai uninstall *${scripts[i]}*...`, { parse_mode: 'Markdown' });

      await new Promise((resolve) => {
        conn.exec(`curl -fsSL ${scriptURL} | bash`, (err, stream) => {
          if (err) {
            bot.sendMessage(chatId, `❌ Gagal mengeksekusi ${scripts[i]}:\n\`${err.message}\``, { parse_mode: 'Markdown' });
            return resolve();
          }

          let output = '';

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            output += `\n[ERROR] ${data.toString()}`;
          });

          stream.on('close', () => {
            const cleanOutput = output.trim().slice(-3800) || '(tidak ada output)';
            bot.sendMessage(chatId, `✅ *${scripts[i]} selesai!*\n📦 Output terakhir:\n\`\`\`${cleanOutput}\`\`\``, { parse_mode: 'Markdown' });
            resolve();
          });
        });
      });
    }

    conn.end();
    bot.sendMessage(chatId, '🎉 Semua uninstall Protect Panel 1-9 selesai!', { parse_mode: 'Markdown' });
  });

  conn.on('error', (err) => {
    bot.sendMessage(chatId, `❌ Gagal terhubung ke VPS!\nPeriksa IP & Password kamu.\n\nError:\n\`${err.message}\``, { parse_mode: 'Markdown' });
  });

  conn.connect({
    host: ipvps,
    port: 22,
    username: 'root',
    password: pwvps
  });
 });
}

module.exports = { setBotInstance };