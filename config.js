// config.js
// GANTI SEMUA NILAI DI BAWAH INI DENGAN NILAI ANDA SENDIRI

module.exports = {
  // --- Token Bot Telegram ---
  // Ambil dari @BotFather
  token: '8291188190:AAGZyhOwxCwra5hZzrpzOWkmmfqJrt148Nc', // <--- GANTI INI

  // --- Konfigurasi Admin ---
  // ID Telegram Anda. Bot owner bisa akses fitur tanpa bayar.
  // Pastikan ID dalam bentuk string.
  // Anda bisa tambahkan beberapa ID: ['id1', 'id2']
  adminId: ['5894696119'], // <--- GANTI INI DENGAN ID TELEGRAM ANDA

  // --- Konfigurasi Duitku ---
  // Ambil dari dashboard Duitku Anda
  DUITKU_MERCHANT_CODE: 'D20182', // <--- GANTI INI
  DUITKU_API_KEY: 'caa4719cecc7354ad8671daf42a44d82', // <--- GANTI INI
  
  // --- Pengaturan Harga & Durasi ---
  // Harga untuk membeli akses (dalam Rupiah)
  accessPrice: 1000, // <--- GANTI INI (contoh: 7000 untuk Rp7.000)
  
  // [BARU] Durasi masa aktif akses dalam HARI
  accessDurationDays: 1, // <--- GANTI INI (sesuai contoh Anda, 1 hari)

  // --- Logging ---
  // ID Grup Telegram untuk menerima log pembelian sukses (opsional)
  // Bot harus menjadi admin di grup ini.
  // Kosongkan jika tidak ingin ada log: adminLogGroup: ''
  adminLogGroup: '-1002518002377' // <--- GANTI INI (contoh: -100123456789)
};
