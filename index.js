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

// ... (sisa fungsi Anda)

function isValidIP(ip) {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipRegex.test(ip);
}
global.subdomain = { 
    "pterodactyl-panel.web.id": {
        zone: "d69feb7345d9e4dd5cfd7cce29e7d5b0",
        apitoken: "32zZwadzwc7qB4mzuDBJkk1xFyoQ2Grr27mAfJcB"
    },
    "storedigital.web.id": {
        zone: "2ce8a2f880534806e2f463e3eec68d31",
        apitoken: "v5_unJTqruXV_x-5uj0dT5_Q4QAPThJbXzC2MmOQ"
    },
    "storeid.my.id": {
        zone: "c651c828a01962eb3c530513c7ad7dcf",
        apitoken: "N-D6fN6la7jY0AnvbWn9FcU6ZHuDitmFXd-JF04g"
    },
    "store-panell.my.id": {
        zone: "0189ecfadb9cf2c4a311c0a3ec8f0d5c", 
        apitoken: "eVI-BXIXNEQtBqLpdvuitAR5nXC2bLj6jw365JPZ"
    }, 
    "xyro.web.id": {
        zone: "46d0cd33a7966f0be5afdab04b63e695", 
        apitoken: "CygwSHXRSfZnsi1qZmyB8s4qHC12jX_RR4mTpm62"
    }, 
    "xyroku.my.id": {
        zone: "f6d1a73a272e6e770a232c39979d5139", 
        apitoken: "0Mae_Rtx1ixGYenzFcNG9bbPd-rWjoRwqN2tvNzo"
    }, 
    "mafiapnel.my.id": {
     zone: "34e28e0546feabb87c023f456ef033bf", 
     apitoken: "bHNaEBwaVSdNklVFzPSkSegxOd9OtKzWtY7P9Zwt"
    },
    "gacorr.biz.id": {
        zone: "cff22ce1965394f1992c8dba4c3db539",
        apitoken: "v9kYfj5g2lcacvBaJHA_HRgNqBi9UlsVy0cm_EhT"
    },
    "cafee.my.id": {
        zone: "0d7044fc3e0d66189724952fa3b850ce", 
        apitoken: "wAOEzAfvb-L3vKYE2Xg8svJpHfNS_u2noWSReSzJ"
    }, 
    "pterodaytl.my.id": {
        zone: "828ef14600aaaa0b1ea881dd0e7972b2",
        apitoken: "75HrVBzSVObD611RkuNS1ZKsL5A_b8kuiCs26-f9"
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
<blockquote>╭─────( 𝙋𝙍𝙊𝙏𝙀𝘾𝙏 )───────╮
│ϟ ɴᴀᴍᴇ ʙᴏᴛ : ᴘʀᴏᴛᴇᴄᴛ ᴠᴠɪᴘ
│ϟ ᴠᴇʀsɪᴏɴ : 1.0 ᴠɪᴘ
│ϟ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @sipicung
│ϟ ᴏᴡɴᴇʀ : @sipicung
│ϟ ɪɴғᴏʀᴍᴀᴛɪᴏɴ : @tokopicung
╰───────────────────╯</blockquote>
<blockquote>╭────────( 𝙐𝙨𝙚𝙧 )──────╮
│ⵢ ᴜsᴇʀ : ${chatId}
╰───────────────────╯</blockquote>
<blockquote>╭──────( 𝘽𝙐𝙔 𝘼𝙆𝙎𝙀𝙎 )────╮
│ⵢ ᴋᴇᴛɪᴋ : /buyadmin
╰───────────────────╯</blockquote>
  `;  // Teks caption untuk menu
  
  const keyboard = {
    parse_mode: "HTML",
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" },
          { text: "⿻ ᴜɴᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "unprotect" },
        ],
        [
          { text: "ᴍᴀᴋᴀsɪʜ ᴅᴇᴠᴇʟᴏᴘᴇʀ", callback_data: "tqto" },
          { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }
        ],
        [
          { text: "ʙᴜʏ sᴄʀɪᴘᴛ ᴘʀᴏᴛᴇᴄᴛ", url: "t.me/sipicung" }
        ]
      ],
    },
  };
  
  bot.sendPhoto(chatId, photoURL, {
    caption: menuText,
    ...keyboard
  });
  
  if (fs.existsSync('./Musik.mp3')) {
    bot.sendAudio(chatId, "./Musik.mp3", {
      title: "</> Protect",
      performer: "kénntzy"
    });
  } else {
    bot.sendMessage(chatId, "🏧 Silahkan Membeli Akses Terlebih Dahulu.");
  }
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
    const text = `<blockquote>╭──✧ <b>ɪɴꜰᴏʀᴍᴀᴛɪon</b> ✧
│ ⪼ Version : 1.0
│ ⪼ Owner : @sipicung
│ ⪼ Language : JavaScript
╰────────────⧽

╭──✧ <b>ᴍᴇɴᴜ ᴘʀᴇᴍɪᴜᴍ</b> ✧
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ1
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ2
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ3
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ4
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ5
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ6
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ7
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ8
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ9
│ ⪼ /ɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛᴀʟʟ
╰────────────⧽
</blockquote>`;

    bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "ᴍᴀᴋᴀsɪʜ ᴅᴇᴠᴇʟᴏᴘᴇʀ", callback_data: "tqto" },
            { text: "<<", callback_data: "back" },
          ],
          [{ text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }],
          [{ text: "ᴜɴᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "unprotect" }],
        ],
      },
    });
  }

  // 2. Handler untuk "unprotect"
  else if (data === "unprotect") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>╭──✧ <b>ɪɴꜰᴏʀᴍᴀᴛɪon</b> ✧
│ ⪼ Version : 1.0 
│ ⪼ Owner : @sipicung
│ ⪼ Language : JavaScript
╰────────────⧽

╭──✧ <b>ᴏᴡɴᴇʀ ᴘʀɪᴠᴀᴛᴇ</b> ✧
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ1
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ2
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ3
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ4
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ5
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ6
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ7
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ8
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛ9
│ ⪼ /ᴜɴɪɴsᴛᴀʟʟᴘʀᴏᴛᴇᴄᴛᴀʟʟ
╰────────────
</blockquote>`;

    bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "<<", callback_data: "back" },
            { text: "⿻ ᴍᴀᴋᴀsɪʜ ᴅᴇᴠ", callback_data: "tqto" },
          ],
          [{ text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }],
        ],
      },
    });
  }

  // 3. Handler untuk "ownermenu"
  else if (data === "ownermenu") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>┌─⧼ <b>ɪɴꜰᴏʀᴍᴀᴛɪon</b> ⧽
│✘ Version : 1.0
│✘ Owner : @sipicung
│✘ Language : JavaScript
╰─────────────

┌─⧼ ᴏᴡɴᴇR ᴍᴇɴᴜ ⧽
│ⵢ /ᴀᴅᴅᴀᴅᴍɪɴ
│ⵢ /ᴅᴇʟᴀᴅᴍɪɴ
│ⵢ /ʟɪsᴛᴀᴅᴍɪɴ
│ⵢ /ɪɴsᴛᴀʟʟᴘᴀɴᴇʟ
│ⵢ /ᴜɴɪɴsᴛᴀʟʟᴘᴀɴᴇʟ
│ⵢ /sᴡɪɴɢs
│ⵢ /sᴜʙᴅᴏ
│ⵢ /ʟɪsᴛsᴜʙᴅᴏ
│ⵢ /sᴇᴛᴘᴡᴠᴘs
│ⵢ /ʜʙᴘᴀɴᴇʟ
│ⵢ /ɪǫᴄ
╰─────────────
</blockquote>`;

    bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" },
            { text: "⿻ ᴜɴᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "unprotect" },
          ],
          [{ text: "<<", callback_data: "back" }],
          [{ text: "ᴍᴀᴋᴀsɪʜ ᴅᴇᴠᴇʟᴏᴘᴇʀ", callback_data: "tqto" }],
        ],
      },
    });
  }

  // 4. Handler untuk "tqto"
  else if (data === "tqto") {
    bot.answerCallbackQuery(callbackQuery.id);
    const text = `<blockquote>╭──✧ <b>ɪɴꜰᴏʀᴍᴀᴛɪon</b> ✧
│ ⪼ Version : 1.0 
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
          [
            { text: "<<", callback_data: "back" },
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" },
          ],
          [{ text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }],
        ],
      },
    });
  }

  // 5. Handler untuk "back" (Digabung dari file Anda)
  else if (data === "back") {
    await bot.answerCallbackQuery(callbackQuery.id);

    const text = `<blockquote>╭─────( 𝙋𝙍𝙊𝙏𝙀𝘾𝙏 )───────╮
│ϟ ɴᴀᴍᴇ ʙᴏᴛ : ᴘʀᴏᴛᴇᴄᴛ ᴠᴠɪᴘ
│ϟ ᴠᴇʀsɪon : 1.0 ᴠɪᴘ
│ϟ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @sipicung
│ϟ ᴏᴡɴᴇʀ : @sipicung
│ϟ ɪɴғᴏʀᴍᴀᴛɪon : @tokopicung
╰───────────────────╯</blockquote>
<blockquote>╭───────( 𝙐𝙨𝙚r )───────╮
│ⵢ ᴜsᴇʀ : ${chatId}
╰───────────────────╯</blockquote>
<blockquote>──────( 𝘽𝙐𝙔 𝘼𝙆𝙎𝙀𝙎 )────╮
│ⵢ ᴋᴇᴛɪᴋ : /buyadmin
╰───────────────────╯</blockquote>`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⿻ ᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "protectmenu" },
            { text: "⿻ ᴜɴᴘʀᴏᴛᴇᴄᴛ ᴍᴇɴᴜ", callback_data: "unprotect" },
          ],
          [
            { text: "ᴍᴀᴋᴀsɪʜ ᴅᴇᴠᴇʟᴏᴘᴇʀ", callback_data: "tqto" },
            { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" },
          ],
          [
            { text: "ʙᴜʏ sᴄʀɪᴘᴛ ᴘʀᴏᴛᴇᴄᴛ", url: "https://t.me/sipicung" },
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
  }

  // 6. Handler untuk "CANCEL_ADMIN" (Digabung dari kode /buyadmin)
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

  // 7. Handler untuk "create_domain" (Digabung dari kode /subdo)
  else if (data.startsWith("create_domain")) {
    const dataSplit = data.split(" ");
    const domainIndex = Number(dataSplit[1]);
    const dom = Object.keys(global.subdomain);

    if (domainIndex < 0 || domainIndex >= dom.length) return bot.sendMessage(msg.chat.id, "Domain tidak ditemukan!");
    if (!dataSplit[2] || !dataSplit[2].includes("|")) return bot.sendMessage(msg.chat.id, "Hostname/IP tidak ditemukan!");

    const tldnya = dom[domainIndex];
    const [host, ip] = dataSplit[2].split("|").map(item => item.trim());

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
  
  // 8. Handler cadangan jika tombol tidak dikenal
  else {
      bot.answerCallbackQuery(callbackQuery.id);
  }
  
});
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
  
  //▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
  // [MODIFIKASI] Perintah Beli Admin (/buyadmin) - dengan KEDALUWARSA
  //▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//

  bot.onText(/^\/buyadmin$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userFirstName = msg.from.first_name || "Telegram User";
    const userUsername = msg.from.username || "tanpa_username";

    // 1. Tentukan detail produk
    const amount = setting.ADMIN_PRICE; 
    const productName = "Akses Admin Bot (1 Hari)"; // Nama produk diubah
    const productId = "ADMIN_ACCESS_1D";
    const durationDays = 1; // Durasi dalam hari

    // 2. Cek jika user sudah jadi admin (menggunakan fungsi baru)
    if (isAdmin(userId)) {
      return bot.sendMessage(chatId, "Anda sudah menjadi Admin.");
    }

    const reff = `BUYADMIN-${userId}-${Date.now()}`;

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
        callbackUrl: `https://example.com/callback/${reff}`, 
        returnUrl: `https://example.com/return/${reff}`,
        signature: signature,
        expiryPeriod: 5 // Kadaluarsa 5 menit
      }, {
        headers: { "Content-Type": "application/json" }
      });

    } catch (e) {
      console.error("Duitku inquiry error (/buyadmin):", e.response ? e.response.data : e.message);
      return bot.sendMessage(chatId, "Gagal menghubungi gateway Duitku. Coba lagi nanti.");
    }

    const result = paymentResp.data;

    // 5. Cek respon Duitku
    if (result.statusCode !== "00") {
      console.error("Duitku Error Response (/buyadmin):", result);
      return bot.sendMessage(chatId, "Gagal membuat transaksi Duitku: " + result.statusMessage);
    }

    const qrString = result.qrString;
    const reference = result.reference; // ID Transaksi Duitku
    const checkoutUrl = result.paymentUrl; // Link bayar web

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
            
            // ================== [PERUBAHAN] ==================
            // Hitung waktu kedaluwarsa (1 hari dari sekarang)
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
            // ================ [AKHIR PERUBAHAN] ================

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
        console.error("checkPayment (Duitku /buyadmin) error", e);
      }
    }, 15000); 
  });

bot.onText(/\/addadmin (\d+)/, async (msg, match) => {
  const senderId = msg.from.id;
  const newAdminId = Number(match[1]);

  // [DIUBAH] Hanya admin permanen yang bisa menambah admin
  if (!isPermanentAdmin(senderId))
    return bot.sendMessage(senderId, "❌ Hanya Admin Permanen yang bisa menggunakan perintah ini.");

  // Gunakan fungsi isAdmin baru
  if (isAdmin(newAdminId))
    return bot.sendMessage(senderId, "⚠️ User ini sudah menjadi admin.");

  // Tambahkan sebagai admin PERMANEN (expiresAt: null)
  setting.ADMIN_IDS.push({ id: newAdminId, expiresAt: null });

  // Simpan ke config.js (Fix: gunakan module.exports)
  const configPath = path.join(__dirname, "setting.js");
  const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
  fs.writeFileSync(configPath, updatedConfig, "utf8");

  await bot.sendMessage(senderId, `✅ Admin permanen baru berhasil ditambahkan!\n👤 ID: <code>${newAdminId}</code>`, { parse_mode: "HTML" });

  try {
    await bot.sendMessage(newAdminId, `🎉 Kamu telah ditambahkan sebagai *Admin Permanen* oleh <b>${msg.from.first_name}</b>.`, { parse_mode: "HTML" });
  } catch (err) {
    console.log("Gagal kirim notifikasi ke admin baru:", err.message);
  }
});

// === /deladmin <user_id> ===
bot.onText(/\/deladmin (\d+)/, async (msg, match) => {
  const senderId = msg.from.id;
  const targetId = Number(match[1]);

  // [DIUBAH] Hanya admin permanen yang bisa menghapus admin
  if (!isPermanentAdmin(senderId))
    return bot.sendMessage(senderId, "❌ Hanya Admin Permanen yang bisa menggunakan perintah ini.");

  // Gunakan fungsi isAdmin baru
  if (!isAdmin(targetId))
    return bot.sendMessage(senderId, "⚠️ User ini bukan admin.");

  // Hapus admin berdasarkan ID dari array objek
  setting.ADMIN_IDS = setting.ADMIN_IDS.filter(admin => admin.id !== targetId);

  // Simpan ke config.js (Fix: gunakan module.exports)
  const configPath = path.join(__dirname, "setting.js");
  const updatedConfig = `module.exports = ${JSON.stringify(setting, null, 2)};\n`;
  fs.writeFileSync(configPath, updatedConfig, "utf8");

  await bot.sendMessage(senderId, `🗑️ Admin dengan ID <code>${targetId}</code> berhasil dihapus.`, { parse_mode: "HTML" });

  try {
    await bot.sendMessage(targetId, `⚠️ Kamu telah dihapus dari daftar *Admin Bot*.`, { parse_mode: "HTML" });
  } catch (err) {
    console.log("Gagal kirim notifikasi ke user:", err.message);
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


bot.onText(/^\/installpanel (.+)$/, async (msg, match) => {
  users.push(msg.from.id); 
  saveUsers(users); 
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const text = match[1]; 
  if (!text) {
    await bot.sendMessage(msg.chat.id, example());
    return;
  }

  const vii = text.split("|");
  if (vii.length < 5) {
    await bot.sendMessage(msg.chat.id, example());
    return;
  }
  if (!isAdmin(senderId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
    }
  // Simpan data pengguna
  userData[msg.from.id] = {
    ip: vii[0],
    password: vii[1],
    domainpanel: vii[2],
    domainnode: vii[3],
    ramserver: vii[4],
    step: "installing",
  };
 
  await bot.sendMessage(
    msg.chat.id,
    "Memproses instalasi server panel...\nTunggu 1-10 menit hingga proses selesai."
  );
  startInstallation(msg, bot); // Panggil fungsi dengan msg dan bot
});

// Fungsi instalasi, diperbarui untuk menerima msg dan bot
function startInstallation(msg, bot) {
  const userId = msg.from.id;
  if (!userData[userId]) {
    bot.sendMessage(msg.chat.id, "Data pengguna tidak ditemukan, silakan ulangi perintah.");
    return;
  }

  const { ip, password, domainpanel, domainnode, ramserver } = userData[userId];

  const ress = new Client();
  const connSettings = {
    host: ip,
    port: 22,
    username: "root",
    password: password,
  };

  const passwordPanel = `admin123`; // Random password
  const commandPanel = `bash <(curl -s https://pterodactyl-installer.se)`;

  // Fungsi untuk instal wings
  const installWings = (conn) => {
    conn.exec(commandPanel, (err, stream) => {
      if (err) {
        bot.sendMessage(msg.chat.id, `Gagal menjalankan instalasi wings: ${err.message}`);
        delete userData[userId];
        return;
      }
      stream
        .on("close", (code, signal) => {
          conn.exec(
            "bash <(curl -s https://raw.githubusercontent.com/SkyzoOffc/Pterodactyl-Theme-Autoinstaller/main/createnode.sh)",
            (err, stream) => {
              if (err) {
                bot.sendMessage(msg.chat.id, `Gagal menjalankan pembuatan node: ${err.message}`);
                delete userData[userId];
                return;
              }
              stream
                .on("close", async (code, signal) => {
                  const teks = `
𝗕𝗘𝗥𝗜𝗞𝗨𝗧 𝗗𝗔𝗧𝗔 𝗣𝗔𝗡𝗘𝗟 𝗔𝗡𝗗𝗔 📎 :
 ᴜsᴇʀɴᴀᴍᴇ : admin
 ᴘᴀssᴡᴏʀᴅ : ${passwordPanel}
 ᴅᴏᴍᴀɪɴ : ${domainpanel}
`;
                  await bot.sendMessage(msg.chat.id, teks);
                  delete userData[userId]; // Bersihkan data setelah selesai
                })
                .on("data", (data) => {
                  const output = data.toString();
                  console.log(output);
                  if (output.includes("Masukkan nama lokasi:"))
                    stream.write("Singapore\n");
                  if (output.includes("Masukkan deskripsi lokasi:"))
                    stream.write("Node By SYAH\n");
                  if (output.includes("Masukkan domain:"))
                    stream.write(`${domainnode}\n`);
                  if (output.includes("Masukkan nama node:"))
                    stream.write("Node By SYAH\n");
                  if (output.includes("Masukkan RAM (dalam MB):"))
                    stream.write(`${ramserver}\n`);
                  if (
                    output.includes(
                      "Masukkan jumlah maksimum disk space (dalam MB):"
                    )
                  )
                    stream.write(`${ramserver}\n`);
                  if (output.includes("Masukkan Locid:")) stream.write("1\n");
                })
                .stderr.on("data", (data) => console.log("Stderr: " + data));
            }
          );
        })
        .on("data", (data) => {
          const output = data.toString();
          console.log("Logger: " + output);
          if (output.includes("Input 0-6")) stream.write("1\n");
          if (output.includes("(y/N)")) stream.write("y\n");
          if (output.includes("Enter the panel address"))
            stream.write(`${domainpanel}\n`);
          if (output.includes("Database host username"))
            stream.write("admin\n");
          if (output.includes("Database host password"))
            stream.write("admin\n");
          if (output.includes("Set the FQDN to use for Let's Encrypt"))
            stream.write(`${domainnode}\n`);
          if (output.includes("Enter email address for Let's Encrypt"))
            stream.write("admin@gmail.com\n");
        })
        .stderr.on("data", (data) => console.log("STDERR: " + data));
    });
  };

  // Fungsi untuk instal panel
  const installPanel = (conn) => {
    conn.exec(commandPanel, (err, stream) => {
      if (err) {
        bot.sendMessage(msg.chat.id, `Gagal menjalankan instalasi panel: ${err.message}`);
        delete userData[userId];
        return;
      }
      stream
        .on("close", (code, signal) => installWings(conn))
        .on("data", (data) => {
          const output = data.toString();
          console.log("Logger: " + output);
          if (output.includes("Input 0-6")) stream.write("0\n");
          if (output.includes("(y/N)")) stream.write("y\n");
          if (output.includes("Database name")) stream.write("\n");
          if (output.includes("Database username")) stream.write("admin\n");
          if (
            output.includes(
              "Password (press enter to use randomly generated password)"
            )
          )
            stream.write("admin\n");
          if (output.includes("Select timezone"))
            stream.write("Asia/Jakarta\n");
          if (output.includes("Provide the email address"))
            stream.write("admin@gmail.com\n");
          if (output.includes("Email address for the initial admin account"))
            stream.write("admin@gmail.com\n");
          if (output.includes("Username for the initial admin account"))
            stream.write("admin\n");
          if (output.includes("First name")) stream.write("admin\n");
          if (output.includes("Last name")) stream.write("admin\n");
          if (output.includes("Password for the initial admin account"))
            stream.write(`${passwordPanel}\n`);
          if (output.includes("Set the FQDN of this panel"))
            stream.write(`${domainpanel}\n`);
          if (output.includes("Do you want to automatically configure UFW"))
            stream.write("y\n");
          if (output.includes("Do you want to automatically configure HTTPS"))
            stream.write("y\n");
          if (output.includes("Select the appropriate number [1-2]"))
            stream.write("1\n");
          if (output.includes("I agree that this HTTPS request"))
            stream.write("y\n");
          if (output.includes("Proceed anyways")) stream.write("y\n");
          if (output.includes("(yes/no)")) stream.write("y\n");
          if (output.includes("Initial configuration completed"))
            stream.write("y\n");
          if (output.includes("Still assume SSL")) stream.write("y\n");
          if (output.includes("Please read the Terms of Service"))
            stream.write("y\n");
          if (output.includes("(A)gree/(C)ancel:")) stream.write("A\n");
        })
        .stderr.on("data", (data) => console.log("STDERR: " + data));
    });
  };

  // Mulai koneksi SSH
  ress
    .on("ready", () => {
      installPanel(ress);
    })
    .on("error", (err) => {
      bot.sendMessage(msg.chat.id, `Gagal koneksi ke server: ${err.message}`);
      delete userData[userId];
    })
    .connect(connSettings);
}

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
// === /listadmin ===
bot.onText(/\/listadmin/, async (msg) => {
  const userId = msg.from.id;
  
  // 1. Gunakan fungsi isAdmin
  if (!isAdmin(userId))
    return bot.sendMessage(userId, "❌ Hanya admin yang bisa melihat daftar admin.");

  if (!setting.ADMIN_IDS.length)
    return bot.sendMessage(userId, "📭 Belum ada admin yang terdaftar.");

  let text = "👑 <b>Daftar Admin Aktif:</b>\n";
  
  // 2. Perbaiki loop untuk membaca objek
  for (const adminObj of setting.ADMIN_IDS) {
    let expiryInfo = "";
    
    // Cek status kedaluwarsa
    if (adminObj.expiresAt === null) {
      expiryInfo = " (Permanen)";
    } else {
      // Ubah timestamp ke tanggal yang bisa dibaca
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

    // Ambil ID dari adminObj.id
    text += `• <code>${adminObj.id}</code>${expiryInfo}\n`;
  }

  await bot.sendMessage(userId, text, { parse_mode: "HTML" });
});

bot.onText(/^\/swings(?:\s+(.+))?/, async (msg, match) => {

  const chatId = msg.chat.id;
  const senderId = msg.from.id;

   if (!isAdmin(senderId))
    return bot.sendMessage(senderId, "❌ Kamu tidak punya izin menghapus admin.");

  const text = match[1];
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /swings ipvps|pwvps|token_node");
  }

  const t = text.split("|");
  if (t.length < 3) {
    return bot.sendMessage(chatId, "❌ Format salah!\n\nContoh:\n/swings ipvps|pwvps|token_node");
  }

  const ipvps = t[0].trim();
  const passwd = t[1].trim();
  const token = t[2].trim();

  let logs = "🚀 Menjalankan proses wings...\n\n";
  const loadingMsg = await bot.sendMessage(chatId, logs);

  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd,
    readyTimeout: 20000
  };

  const conn = new Client();
  const command = token;

  function updateLogs(newLine) {
    logs += newLine + "\n";
    safeEdit(bot, chatId, loadingMsg.message_id, "```\n" + logs.slice(-3500) + "\n```"); // max 4096 limit
  }

  conn.on("ready", () => {
    updateLogs("✅ SSH Connected!");

    conn.exec(command, (err, stream) => {
      if (err) {
        updateLogs("❌ Gagal menjalankan token node.");
        return conn.end();
      }

      updateLogs("▶️ Menjalankan token...");

      stream.stdout.on("data", (data) => updateLogs("TOKEN OUT: " + data.toString().trim()));
      stream.stderr.on("data", (data) => updateLogs("TOKEN ERR: " + data.toString().trim()));

      stream.on("close", () => {
        updateLogs("✅ Token selesai, lanjut jalankan wings...");

        conn.exec("sudo wings", (err2, stream2) => {
          if (err2) {
            updateLogs("❌ Gagal menjalankan wings.");
            return conn.end();
          }

          updateLogs("▶️ Menjalankan wings...");

          stream2.stdout.on("data", (data) => updateLogs("WINGS OUT: " + data.toString().trim()));
          stream2.stderr.on("data", (data) => updateLogs("WINGS ERR: " + data.toString().trim()));

          stream2.on("close", () => {
            updateLogs("✅ Wings berhasil dijalankan!\n\nJika masih merah:\n1. Login VPS di JuiceSSH\n2. Ketik `sudo wings --debug`\n3. Refresh panel");
            conn.end();
          });
        });
      });
    });
  })
  .on("error", (err) => {
    updateLogs("❌ Connection Error: " + err.message);
  })
  .on("end", () => updateLogs("🔌 SSH Connection closed"))
  .connect(connSettings);
});

async function safeEdit(bot, chatId, messageId, text) {
  try {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error("Telegram editMessage error:", e.message);
  }
}

bot.onText(/^\/subdo(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const input = match[1];
     const senderId = msg.from.id;

    // Validasi premium
if (!isAdmin(userId)) {
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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
      return bot.sendMessage(chatId, '⚠️ Silahkan Untuk Mebeli Akses Terlebih Dahulu Dengan Mengetik /buyadmin');
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