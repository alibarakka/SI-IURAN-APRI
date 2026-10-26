# SI-IURAN APRI Sulawesi Selatan

Sistem Informasi Rekapitulasi Iuran Anggota Asosiasi Penghulu Republik Indonesia (APRI) Pengurus Wilayah Sulawesi Selatan.

## Panduan Deploy ke Vercel (vercel.app)

Project ini telah dikonfigurasi dengan file `vercel.json` dan siap dideploy langsung ke **Vercel**.

### Cara 1: Deploy Otomatis via GitHub (Sangat Direkomendasikan)
1. Upload/Push repositori source code ini ke akun **GitHub** Anda (misalnya: `apri-sulsel-iuran`).
2. Kunjungi dashboard [Vercel](https://vercel.com/) dan login (bisa login langsung dengan akun GitHub).
3. Klik tombol **"Add New..."** lalu pilih **"Project"**.
4. Pilih repository GitHub Anda, lalu klik **"Import"**.
5. Konfigurasi build otomatis terdeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Klik tombol **"Deploy"**.
7. Dalam 1–2 menit, aplikasi Anda akan aktif dan online di URL seperti:
   `https://apri-sulsel-iuran.vercel.app`

### Cara 2: Deploy Cepat via Terminal (Vercel CLI)
Jika menggunakan command line di laptop Anda:
```bash
# 1. Install Vercel CLI global
npm install -g vercel

# 2. Jalankan perintah deploy di folder project
vercel

# 3. Ikuti prompt konfirmasi di layar (tekan Enter untuk setelan default)
# 4. Untuk deploy ke domain production:
vercel --prod
```

## Fitur Utama
- **Dual Mode**: Web Admin Bendahara & Preview Aplikasi Mobile KUA Penghulu
- **Payment Gateway**: Integrasi simulasi QRIS Dinamis dan Virtual Account (Bank Sulselbar Syariah, BSI, Mandiri, BRI)
- **Rekonsiliasi Real-Time**: Verifikasi instan dan penerbitan kwitansi sah resmi
- **Pengingat Jatuh Tempo**: Otomasi notifikasi bulanan via WhatsApp API & WebPush
- **Buku Kas Umum (BKU)**: Laporan arus kas, saldo organisasi, dan pos anggaran kepenghuluan
- **Enkripsi Data (AES-256-GCM)**: Perlindungan data sensitif anggota sesuai UU PDP No. 27/2022
- **Ekspor Dokumen**: 1-Click Export ke Excel (.csv) dan PDF Resmi (.pdf)
