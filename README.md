# POS UMKM - Aplikasi Point of Sale

Aplikasi Point of Sale (POS) sederhana untuk UMKM berbasis React Native Expo.

## Fitur

### Manajemen Produk
- Tambah, edit, dan hapus produk
- Pencarian produk
- Manajemen stok dengan peringatan stok menipis
- Kategorisasi produk (Makanan, Minuman, Snack, dll.)
- Tampilan harga dan stok yang informatif

### Transaksi Penjualan
- Keranjang belanja interaktif
- Pencarian produk real-time
- Kalkulasi total otomatis
- Pengaturan jumlah item dengan validasi stok
- Proses pembayaran dengan perhitungan kembalian
- Cetak struk/invoice (PDF & Print)

### Manajemen Pelanggan
- Database pelanggan lengkap
- Sistem membership (Regular, Silver, Gold, Platinum)
- Sistem poin reward
- Riwayat transaksi pelanggan
- Diskon berdasarkan level membership

### Manajemen Pengguna
- Multi-user role (Admin & Kasir)
- Manajemen akses berdasarkan role
- Fitur ganti password
- Riwayat aktivitas pengguna

### Dashboard & Analitik
- Grafik penjualan (Harian/Mingguan/Bulanan)
- Ringkasan total penjualan
- Statistik transaksi
- Produk terlaris
- Analisis tren penjualan

### Laporan
- Laporan penjualan detail
- Filter berdasarkan periode
- Riwayat transaksi lengkap
- Detail transaksi per item

### UI/UX Modern
- Material Design dengan React Native Paper
- Animasi transisi halaman
- Responsif untuk berbagai ukuran layar
- Navigasi yang intuitif
- Tema warna yang konsisten

## Teknologi yang Digunakan

- React Native
- Expo
- React Navigation
- React Native Paper
- SQLite Database
- AsyncStorage
- Expo Print & Sharing

## Cara Menjalankan Aplikasi

1. Install dependencies:
   ```bash
   npm install
   ```

2. Jalankan aplikasi:
   ```bash
   npm start
   ```

3. Scan QR code dengan aplikasi Expo Go di smartphone, atau tekan:
   - `a` untuk menjalankan di Android emulator
   - `i` untuk menjalankan di iOS simulator
   - `w` untuk menjalankan di web browser

## Struktur Proyek

```
pos-umkm/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable components
│   ├── features/         # Feature modules
│   │   ├── analytics/    # Dashboard & analytics
│   │   ├── customers/    # Customer management
│   │   └── invoices/     # Invoice generation
│   └── utils/           # Helper functions & database
├── assets/              # Images, fonts, etc.
├── App.js              # Root component
└── package.json        # Dependencies
```

## Pengembangan Selanjutnya

- Integrasi dengan printer thermal
- Backup & restore database
- Manajemen supplier
- Notifikasi stok menipis
- Export data ke Excel
- Dark mode
- Multiple outlet support
- Integrasi dengan marketplace

## Lisensi

MIT License