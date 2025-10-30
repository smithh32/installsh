/*
[+] ============================== [+]
BASE BY @wannoffc
MODIFIED BY RuztanXD & Gemini
FITUR : Install Panel & Wings dengan Duitku Payment
VERSI : 2.0 (dengan Masa Aktif)
================================= [+]
*/

// Core Dependencies
const TelegramBot = require('node-telegram-bot-api');
const { Client } = require('ssh2');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');

// --- KONFIGURASI ---
const settings = require('./config');
const botToken = settings.token;
const bot = new TelegramBot(botToken, { polling: true });

// --- FILE DATABASE (JSON) ---
// [DIUBAH] File ini sekarang menyimpan object: { "userId": expiryTimestamp }
const PAID_USERS_FILE = 'paidUsers.json';
const ORDERS_FILE = 'orders.json';

// --- POLLING AKTIF ---
const activePolls = {};

// --- FUNGSI HELPER (JSON) ---

/**
 * Membaca file JSON secara sinkron.
 * @param {string} filePath - Path ke file.
 * @param {*} defaultValue - Nilai default jika file tidak ada.
 * @returns {object}
 */
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error);
  }
  return defaultValue;
}

/**
 * Menulis data ke file JSON secara sinkron.
 * @param {string} filePath - Path ke file.
 * @param {object} data - Data untuk ditulis.
 */
function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
  }
}

// --- FUNGSI HELPER (ORDERS & USERS) ---

const readOrders = () => readJsonFile(ORDERS_FILE, {});
const saveOrders = (data) => saveJsonFile(ORDERS_FILE, data);

// [DIUBAH] Membaca paidUsers sebagai object {}
const getPaidUsers = () => readJsonFile(PAID_USERS_FILE, {}); 

/**
 * [BARU] Menambahkan ID Telegram user ke daftar paidUsers.json dengan timestamp
 * @param {string|number} telegramId
 */
function addPaidUser(telegramId) {
  const users = getPaidUsers();
  const idStr = String(telegramId);
  const now = new Date();
  // Hitung timestamp kedaluwarsa
  const expiryTime = now.getTime() + (settings.accessDurationDays * 24 * 60 * 60 * 1000);
  
  users[idStr] = expiryTime;
  saveJsonFile(PAID_USERS_FILE, users);
  console.log(`[ACCESS GRANTED] User ${idStr} added. Expires at ${new Date(expiryTime).toISOString()}`);
}

/**
 * Cek apakah user adalah Owner/Admin dari config
 * @param {string|number} telegramId
 * @returns {boolean}
 */
function isOwner(telegramId) {
  return settings.adminId && settings.adminId.includes(String(telegramId));
}

/**
 * [DIUBAH] Mengecek status akses pengguna (Aktif, Kedaluwarsa, atau Belum Bayar)
 * @param {string|number} telegramId
 * @returns {'ACTIVE' | 'EXPIRED' | 'NOT_PAID'}
 */
function getAccessStatus(telegramId) {
  const idStr = String(telegramId);

  // 1. Owner selalu aktif
  if (isOwner(idStr)) {
    return 'ACTIVE';
  }

  // 2. Cek database pengguna berbayar
  const users = getPaidUsers();
  const expiryTime = users[idStr];

  // 3. Jika tidak ada di database
  if (!expiryTime) {
    return 'NOT_PAID';
  }

  // 4. Cek jika sudah kedaluwarsa
  const now = new Date().getTime();
  if (now > expiryTime) {
    console.log(`[ACCESS EXPIRED] User ${idStr} expired.`);
    // Hapus pengguna dari file
    delete users[idStr];
    saveJsonFile(PAID_USERS_FILE, users);
    return 'EXPIRED';
  }

  // 5. Jika masih aktif
  return 'ACTIVE';
}

// --- FUNGSI HELPER (LAINNYA) ---

const sendMessage = (chatId, text) => bot.sendMessage(chatId, text);

function generateRandomPassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#%^&*';
  const length = 10;
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
}

function formatDate(date = new Date()) {
  return date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

// --- COMMAND HANDLERS ---

// /start - Menu utama
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name;

  const menuText = `
Halo ${username}, selamat datang di Bot Installer! 👋

Bot ini menyediakan layanan instalasi otomatis Pterodactyl Panel dan Wings.

Untuk menggunakan fitur, Anda harus membeli akses terlebih dahulu.
Akses akan aktif selama **${settings.accessDurationDays} hari**.

Gunakan perintah di bawah ini:
➡️ **/buyaccess** - Untuk membeli akses fitur.
➡️ **/installpanel** - Untuk install Pterodactyl Panel.
➡️ **/startwings** - Untuk mengkonfigurasi Wings.
`;
  bot.sendMessage(chatId, menuText);
});

// [BARU] /addaccess - Manual add user (Owner Only)
bot.onText(/\/addaccess (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const ownerId = msg.from.id;

  // --- 1. GATE CHECK ---
  // Hanya Owner (dari config.js) yang bisa pakai
  if (!isOwner(ownerId)) {
    return bot.sendMessage(chatId, '❌ Perintah ini hanya untuk Owner Utama.');
  }

  // --- 2. Parse Input ---
  const targetId = match[1];
  const days = parseInt(match[2]);

  if (!targetId || isNaN(days) || days <= 0) {
    return bot.sendMessage(chatId, 'Format salah.\nGunakan: /addaccess <USER_ID> <JUMLAH_HARI>\nContoh: /addaccess 123456789 30');
  }

  // --- 3. Add User Logic ---
  try {
    const users = getPaidUsers();
    const idStr = String(targetId);
    const now = new Date();
    const expiryTime = now.getTime() + (days * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(expiryTime);

    // Simpan ke file
    users[idStr] = expiryTime;
    saveJsonFile(PAID_USERS_FILE, users);

    console.log(`[MANUAL ACCESS] Owner ${ownerId} added user ${idStr} for ${days} days.`);

    // --- 4. Send Confirmations ---
    
    // Konfirmasi ke Owner
    bot.sendMessage(chatId, `✅ Berhasil menambahkan akses.
User ID: ${idStr}
Durasi: ${days} hari
Kedaluwarsa pada: ${expiryDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);

    // Notifikasi ke User (akan gagal jika user belum pernah chat bot)
    bot.sendMessage(targetId, `🎉 Selamat!
Owner telah memberi Anda akses ke fitur bot.
Durasi: ${days} hari
Kedaluwarsa pada: ${expiryDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`).catch((error) => {
        console.log(`Gagal kirim notifikasi ke user ${targetId}. Mungkin bot diblokir.`);
        bot.sendMessage(chatId, `(Gagal mengirim notifikasi ke user ${targetId}, mungkin user belum memulai bot.)`);
    });

  } catch (error) {
    console.error("Error in /addaccess:", error);
    bot.sendMessage(chatId, 'Terjadi error saat menambahkan user. Cek log console.');
  }
});

// [BARU] Handler jika format /addaccess salah
bot.onText(/\/addaccess$/, (msg) => {
    if (!isOwner(msg.from.id)) {
        return bot.sendMessage(msg.chat.id, '❌ Perintah ini hanya untuk Owner Utama.');
    }
    bot.sendMessage(msg.chat.id, 'Format salah.\nGunakan: /addaccess <USER_ID> <JUMLAH_HARI>\nContoh: /addaccess 123456789 30');
});

// /buyaccess - Logika Pembayaran Duitku
bot.onText(/\/buyaccess/, async (msg) => {
  const chatId = msg.chat.id;
  const targetTelegramId = msg.from.id;
  const buyerUsername = msg.from.username || "tanpa_username";

  // 1. Cek jika user sudah jadi owner/paid user
  // [DIUBAH] Menggunakan getAccessStatus
  const currentStatus = getAccessStatus(targetTelegramId);
  if (currentStatus === 'ACTIVE') {
    
    // Jika dia owner, beri tahu
    if (isOwner(targetTelegramId)) {
        return bot.sendMessage(chatId, "Anda adalah Owner. Anda tidak perlu membeli akses.");
    }
    
    // Jika dia user berbayar, beri tahu kapan kedaluwarsa
    const users = getPaidUsers();
    const expiryDate = new Date(users[String(targetTelegramId)]).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    return bot.sendMessage(chatId, `Anda masih memiliki akses aktif hingga:\n${expiryDate}`);
  }

  // Konfigurasi dari settings.js
  const amount = settings.accessPrice;
  const productName = `Akses Bot Installer (${settings.accessDurationDays} Hari)`;
  const productId = "INSTALL_ACCESS_V2";
  const reff = `BUYACCESS-${Date.now()}`;

  // 2. Buat signature Duitku
  const rawSignature = settings.DUITKU_MERCHANT_CODE + reff + amount + settings.DUITKU_API_KEY;
  const signature = crypto.createHash("md5").update(rawSignature).digest("hex");

  let paymentResp;
  try {
    // 3. Request Inquiry ke Duitku
    paymentResp = await axios.post("https://passport.duitku.com/webapi/api/merchant/v2/inquiry", {
      merchantCode: settings.DUITKU_MERCHANT_CODE,
      paymentAmount: amount,
      paymentMethod: "SP", // QRIS
      merchantOrderId: reff,
      productDetails: productName,
      customerVaName: msg.from.first_name || "Telegram User",
      email: `${targetTelegramId}@bot.id`, // Email placeholder
      phoneNumber: "08123456789", // Placeholder
      itemDetails: [{
        name: productName,
        price: amount,
        quantity: 1
      }],
      callbackUrl: `https://example.com/callback/${reff}`, // Ganti jika perlu
      returnUrl: `https://example.com/return/${reff}`, // Ganti jika perlu
      signature: signature,
      expiryPeriod: 5 // Kadaluarsa 5 menit
    }, {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Duitku inquiry error (/buyaccess):", e.response ? e.response.data : e.message);
    return bot.sendMessage(chatId, "Gagal menghubungi gateway Duitku. Coba lagi nanti.");
  }

  const result = paymentResp.data;

  // 4. Cek respon Duitku
  if (result.statusCode !== "00") {
    console.error("Duitku Error Response (/buyaccess):", result);
    return bot.sendMessage(chatId, "Gagal membuat transaksi Duitku: " + result.statusMessage);
  }

  const qrString = result.qrString;
  const reference = result.reference; // ID Transaksi Duitku
  const checkoutUrl = result.paymentUrl; // Link bayar web

  // 5. Buat QR Code dari qrString
  const buffer = await QRCode.toBuffer(qrString, { width: 400, color: { dark: "#000000", light: "#ffffff" } });

  // 6. Kirim QR Code ke user
  const sentMsg = await bot.sendPhoto(chatId, buffer, {
    caption: `𝗜𝗡𝗩𝗢ІCE 𝗣𝗔𝗬𝗠𝗘𝗡𝗧 💰

𝗣𝗿𝗼𝗱𝘂𝗸 : ${productName}
𝗧𝗼𝘁𝗮𝗹 𝗧𝗮𝗴𝗶𝗵𝗮𝗻 : Rp${amount}
𝗤𝗿𝗶𝘀 Kadaluaarsa 𝗗𝗮𝗹𝗮𝗺 : 5 menit
------------------------------------------
🕓 Sistem akan 𝗰𝗲𝗸 𝗼𝘁𝗼𝗺𝗮𝘁𝗶𝘀 setiap 15 detik hingga pembayaran terverifikasi.`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Bayar di Website", url: checkoutUrl }],
        [{ text: "❌ Batalkan", callback_data: `CANCEL|${reff}` }]
      ]
    }
  });

  // 7. Simpan order ke orders.json
  const orders = readOrders();
  orders[reff] = {
    reff,
    productId: productId,
    targetTelegramId: targetTelegramId,
    buyerUsername: buyerUsername,
    status: "pending",
    created: Date.now(),
    reference, // ID Duitku
    paymentData: result,
    qrisMessageId: sentMsg.message_id,
    chatId: chatId
  };
  saveOrders(orders);

  // 8. POLLING PEMBAYARAN
  let attempts = 0;
  const maxAttempts = 20; // 20 * 15 detik = 300 detik = 5 menit (sesuai expiry)

  const interval = setInterval(async () => {
    attempts++;

    // Ambil order terbaru dari file
    const currentOrders = readOrders();
    const order = currentOrders[reff];

    // Jika order sudah tidak ada (dibatalkan), hentikan polling
    if (!order) {
      clearInterval(interval);
      delete activePolls[reff];
      return;
    }
    
    // Jika sudah expired
    if (attempts > maxAttempts) {
      clearInterval(interval);
      delete activePolls[reff];
      
      if (order.status === "pending") {
        if (order.qrisMessageId && order.chatId) {
          try {
            await bot.deleteMessage(order.chatId, order.qrisMessageId);
          } catch (e) { /* biarkan */ }
        }
        delete currentOrders[reff];
        saveOrders(currentOrders);
        
        await bot.sendMessage(order.chatId, "⏳ Invoice kadaluarsa, silakan buat order baru jika belum bayar.");
      }
      return;
    }

    // Jika masih pending, cek status
    try {
      const sigCheck = crypto.createHash("md5")
        .update(settings.DUITKU_MERCHANT_CODE + reff + settings.DUITKU_API_KEY)
        .digest("hex");

      const statusResp = await axios.post("https://passport.duitku.com/webapi/api/merchant/transactionStatus", {
        merchantCode: settings.DUITKU_MERCHANT_CODE,
        merchantOrderId: reff,
        signature: sigCheck
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const status = statusResp?.data?.statusCode;

      if (status === "00") { // "00" = Sukses
        clearInterval(interval);
        delete activePolls[reff];
        
        const finalOrder = currentOrders[reff];
        if (!finalOrder || finalOrder.status === "paid") return; 

        finalOrder.status = "paid";
        saveOrders(currentOrders);

        // --- LOGIKA SUKSES ---
        try {
          // 1. Tambahkan ID pembeli ke file paidUsers.json
          addPaidUser(finalOrder.targetTelegramId);

          // [DIUBAH] Ambil tanggal kedaluwarsa untuk pesan sukses
          const users = getPaidUsers();
          const expiryTimestamp = users[String(finalOrder.targetTelegramId)];
          const expiryDate = new Date(expiryTimestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

          // 2. Kirim pesan sukses ke pembeli
          await bot.sendMessage(finalOrder.chatId, `𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 ✅
𝗧𝗮𝗻𝗴𝗴𝗮𝗹 : ${formatDate()}
𝗡𝗼𝗺𝗼𝗿 𝗥𝗲𝗳𝗲𝗿𝗲𝗻𝘀𝗶 : ${reff}
𝗜𝗗 𝗧𝗿𝗮𝗻𝘀𝗮𝗸𝘀𝗶 : ${reference}
------------------------------------------
𝗣𝗿𝗼𝗱𝘂𝗸 : ${productName}
𝗧𝗼𝘁𝗮𝗹 𝗧𝗮𝗴𝗶𝗵𝗮𝗻 : Rp${amount}
------------------------------------------
🎉 Selamat! Akun Anda telah mendapatkan akses.

Akses Anda aktif selama **${settings.accessDurationDays} hari** dan akan kedaluwarsa pada:
**${expiryDate}**

🛡️ Gunakan Perintah /installpanel atau /startwings sekarang.`);

          // 3. Kirim log ke Admin
          if (settings.adminLogGroup) {
            await bot.sendMessage(settings.adminLogGroup,
`PEMBELIAN AKSES BERHASIL ✅

𝗧𝗮𝗻𝗴𝗴𝗮𝗹 : ${formatDate()}
𝗡𝗼𝗺𝗼𝗿 𝗥𝗲𝗳𝗲𝗿𝗲𝗻𝘀𝗶 : ${reff}
Durasi: ${settings.accessDurationDays} hari
------------------------------------------
👤 User @${finalOrder.buyerUsername} (ID: ${finalOrder.targetTelegramId})
Telah membeli Akses Fitur.`);
          }

        } catch (error) {
          console.error("[SUCCESS LOGIC ERROR]", error);
          await bot.sendMessage(
            finalOrder.chatId,
            "⚠️ Pembayaran sukses, tapi terjadi kesalahan dalam upgrade akun. Silakan hubungi admin."
          );
        }

      } else if (status === "01") {
        // Pending, biarkan
        console.log(`[POLLING] Reff: ${reff}, Status: Pending`);
      } else if (status) {
        // Gagal/Expired
        clearInterval(interval);
        delete activePolls[reff];
        delete currentOrders[reff];
        saveOrders(currentOrders);
        await bot.sendMessage(order.chatId, `⏳ Invoice gagal atau kadaluarsa (Status: ${statusResp?.data?.statusMessage || 'N/A'}). Silakan buat order baru.`);
      }
    } catch (e) {
      console.error("checkPayment (Duitku /buyaccess) error", e);
    }
  }, 15000); // Cek setiap 15 detik

  // Simpan interval ID untuk pembatalan
  activePolls[reff] = interval;

});

// Handler untuk tombol "Batalkan"
bot.on('callback_query', (callbackQuery) => {
  const [action, reff] = callbackQuery.data.split('|');
  const chatId = callbackQuery.message.chat.id;
  const msgId = callbackQuery.message.message_id;

  if (action === 'CANCEL') {
    const orders = readOrders();
    const order = orders[reff];

    if (order) {
      // 1. Hentikan polling
      if (activePolls[reff]) {
        clearInterval(activePolls[reff]);
        delete activePolls[reff];
      }
      
      // 2. Hapus order dari file
      delete orders[reff];
      saveOrders(orders);
      
      // 3. Hapus pesan QR Code
      bot.deleteMessage(chatId, msgId);
      
      // 4. Kirim konfirmasi
      bot.sendMessage(chatId, "Pesanan telah dibatalkan.");
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Dibatalkan' });
    } else {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Pesanan tidak ditemukan' });
      // Hapus pesan jika order sudah tidak valid
      bot.deleteMessage(chatId, msgId);
    }
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// /installpanel (HANYA UNTUK USER BERBAYAR / OWNER)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
bot.onText(/^(\.|\#|\/)installpanel$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /installpanel ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @sipicung`);
});
bot.onText(/\/installpanel (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  
  // --- [DIUBAH] GATE CHECK DENGAN MASA AKTIF ---
  const accessStatus = getAccessStatus(msg.from.id);
  if (accessStatus === 'NOT_PAID') {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Pengguna Berbayar. Silakan /buyaccess terlebih dahulu.');
      return;
  }
  if (accessStatus === 'EXPIRED') {
      bot.sendMessage(chatId, 'Akses Anda telah kedaluwarsa. Silakan /buyaccess untuk membeli akses baru.');
      return;
  }
  // --- END GATE (Akses = 'ACTIVE') ---

  const t = text.split(',');
  if (t.length < 5) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /installpanel ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @sipicung');
  }
  const ipvps = t[0];
  const passwd = t[1];
  const subdomain = t[2];
  const domainnode = t[3];
  const ramvps = t[4];
  const connSettings = {
    host: ipvps,
    port: 22,
    username: 'root',
    password: passwd
  };
 let password = generateRandomPassword();
 const command = 'bash <(curl -s https://pterodactyl-installer.se)';
 const commandWings = 'bash <(curl -s https://pterodactyl-installer.se)';  
 const conn = new Client();

  conn.on('ready', () => {
    sendMessage(chatId, `PROSES PENGINSTALLAN SEDANG BERLANGSUNG MOHON TUNGGU 5-10MENIT\nscript by @sipicung`);
    conn.exec(command, (err, stream) => {
      if (err) throw err;

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
      console.log('Connection Error: ' + err);
      sendMessage(chatId, 'Koneksi Gagal: Pastikan IP, username (root), dan password VPS sudah benar.');
  }).connect(connSettings);
  
  async function installWings(conn, domainnode, subdomain, password, ramvps) {
        sendMessage(chatId, `PROSES PENGINSTALLAN WINGS SEDANG BERLANGSUNG MOHON TUNGGU 5 MENIT\nscript by @sipicung`);
        conn.exec(commandWings, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Wings installation stream closed with code ${code} and signal ${signal}');
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
        sendMessage(chatId, `MEMULAI CREATE NODE & LOCATION\nscript by @sipicung`);     
        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Node creation stream closed with code ${code} and ${signal} signal');
                conn.end();
                sendPanelData(subdomain, password);
            }).on('data', (data) => {
                handleNodeCreationInput(data, stream, domainnode, ramvps);
        }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }
        
   // Func Handler 'sendPanelData' 
    function sendPanelData(subdomain, password) {
        sendMessage(chatId,`DATA PANEL ANDA\n\n🟢 USERNAME: admin\n🟢 PASSWORD: ${password}\n🟢 LOGIN: ${subdomain}\n\nNote: Semua Instalasi Telah Selesai Silahkan Simpan Data Admin Dengan Baik \nNote: Jika Data Hilang Maka Admin Tidak Bertanggung Jawab \nscript by @sipicung`);
    }
    
   // Func Handler 'handlePanelInstallationInput' 
   function handlePanelInstallationInput(data, stream, subdomain, password) {
        if (data.toString().includes('Input')) {
            stream.write('0\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('1248\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('Asia/Jakarta\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('admin@gmail.com\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('admin@gmail.com\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('admin\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('adm\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('adm\n');
        }
        if (data.toString().includes('Input')) {
            stream.write(`${password}\n`);
        }
        if (data.toString().includes('Input')) {
            stream.write(`${subdomain}\n`);
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('yes\n');
        }
        if (data.toString().includes('Please read the Terms of Service')) {
            stream.write('A\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('1\n');
        }
        console.log('STDOUT: ' + data);
    }
    
    // Func Handler 'handleWingsInstallationInput'
    function handleWingsInstallationInput(data, stream, domainnode, subdomain) {
        if (data.toString().includes('Input')) {
            stream.write('1\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write(`${subdomain}\n`);
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('user\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('1248\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write(`${domainnode}\n`);
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('admin@gmail.com\n');
        }
        if (data.toString().includes('Input')) {
            stream.write('y\n');
        }
        console.log('STDOUT: ' + data);
    }

    function handleNodeCreationInput(data, stream, domainnode, ramvps) {
        stream.write('ruztanxd\n');
        stream.write('4\n');
        stream.write('LOCATION\n');
        stream.write('Jangan Lupa Sholat\n');
        stream.write(`${domainnode}\n`);
        stream.write('NODES\n');
        stream.write(`${ramvps}\n`);
        stream.write(`${ramvps}\n`);
        stream.write('1\n');
        console.log('STDOUT: ' + data);
    }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// /startwings (HANYA UNTUK USER BERBAYAR / OWNER)
bot.onText(/^(\.|\#|\/)startwings$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /startwings ipvps,password,token\nOWNER @sipicung`);
  });
bot.onText(/\/startwings (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  // --- [DIUBAH] GATE CHECK DENGAN MASA AKTIF ---
  const accessStatus = getAccessStatus(msg.from.id);
  if (accessStatus === 'NOT_PAID') {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Pengguna Berbayar. Silakan /buyaccess terlebih dahulu.');
      return;
  }
  if (accessStatus === 'EXPIRED') {
      bot.sendMessage(chatId, 'Akses Anda telah kedaluwarsa. Silakan /buyaccess untuk membeli akses baru.');
      return;
  }
  // --- END GATE (Akses = 'ACTIVE') ---

  const text = match[1];
  const t = text.split(',');
  if (t.length < 3) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /startwings ipvps,password,token\nOWNER @sipicung');
  }
  const ipvps = t[0];
  const passwd = t[1];
  const token = t[2];
  const connSettings = {
    host: ipvps,
    port: 22,
    username: 'root',
    password: passwd
  };
    const conn = new Client();
    const command = 'bash <(curl https://raw.githubusercontent.com/RuztanHosting/RuzPrivat/main/install.sh)'
 
    conn.on('ready', () => {
        sendMessage(chatId,' PROSES CONFIGURE WINGS\nscript by @sipicung')
        
        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Stream closed with code ${code} and ${signal} signal');
                sendMessage(chatId, 'SUCCES START WINGS DI PANEL ANDA COBA CEK PASTI IJO😁\nscript by @sipicung');
                conn.end();
            }).on('data', (data) => {
                stream.write('RuztanXD\n');
                stream.write('3\n');
                stream.write(`${token}\n`)
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        console.log('Connection Error: ' + err);
        sendMessage(chatId, 'Katasandi atau IP tidak valid');
    }).connect(connSettings);
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log("Bot installer (Duitku version) is running...");