# POS UMKM - Aplikasi Point of Sale

Aplikasi Point of Sale (POS) sederhana untuk UMKM berbasis React Native Expo.

## Fitur

- Manajemen Produk
  - Tambah, edit, dan hapus produk
  - Pencarian produk
  - Manajemen stok

- Transaksi Penjualan
  - Keranjang belanja
  - Kalkulasi total otomatis
  - Proses pembayaran
  - Perhitungan kembalian

- UI Modern
  - Material Design dengan React Native Paper
  - Responsif untuk berbagai ukuran layar
  - Navigasi yang mudah

## Teknologi yang Digunakan

- React Native
- Expo
- React Navigation
- React Native Paper
- AsyncStorage

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
│   ├── utils/           # Helper functions
│   └── assets/          # Images, fonts, etc.
├── App.js               # Root component
└── package.json         # Dependencies
```

## Pengembangan Selanjutnya

- Integrasi dengan database
- Manajemen pelanggan
- Laporan penjualan
- Fitur cetak struk
- Multiple user roles (admin/kasir)

## Lisensi

MIT License 