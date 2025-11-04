// start.js
//       
//       
//        
//        
// SYAH
const TelegramBot = require('node-telegram-bot-api');
const { token } = require('./setting');
const { setBotInstance } = require('./index');

const bot = new TelegramBot(token, { polling: true });
setBotInstance(bot);

console.log(' Zero Bot Aktif!');
console.log(' Bot berhasil dijalankan!');