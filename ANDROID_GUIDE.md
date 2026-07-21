# Panduan Pengembangan Aplikasi Android NefuSoft (Java & Kotlin)

Dokumen ini menjelaskan arsitektur, konfigurasi, dan implementasi kode sumber aplikasi native Android (hybrid WebView) NefuSoft Anime yang dibangun menggunakan gabungan bahasa pemrograman **Java** dan **Kotlin**.

---

## 1. Arsitektur Aplikasi

Aplikasi ini menggunakan pendekatan hybrid berbasis WebView modern untuk merender situs web NefuSoft secara optimal dan aman. Struktur program terdiri dari dua aktivitas utama:

1. **SplashActivity (Java)**:
   - Bertanggung jawab sebagai layar pemuat (*splash screen*) pertama kali saat aplikasi dibuka.
   - Melakukan verifikasi koneksi internet (*network connectivity check*).
   - Menampilkan logo visual "NefuSoft" dan indikator pemuatan (*ProgressBar*) sebelum mengalihkan pengguna ke halaman utama.

2. **MainActivity (Kotlin)**:
   - Merupakan aktivitas utama yang memuat dan merender situs web NefuSoft via WebView teroptimasi tinggi.
   - Diimplementasikan dalam bahasa **Kotlin** untuk pemanfaatan fitur-fitur modern Android Jetpack (seperti `OnBackPressedDispatcher`).

---

## 2. Optimasi WebView (MainActivity.kt)

Untuk memastikan pengalaman tontonan anime yang mulus, stabil, dan cepat layaknya aplikasi native, WebView dikonfigurasi secara mendalam dengan pengaturan berikut:

- **JavaScript & DOM Storage**: Diaktifkan (`settings.javaScriptEnabled = true`, `settings.domStorageEnabled = true`) untuk mendukung seluruh fungsionalitas React, Supabase Realtime (Live Chat), dan penyimpanan data lokal (*Watch History*, *Favorites*).
- **Wide Viewport & Zoom**: Mendukung penskalaan halaman otomatis untuk layar berbagai ukuran tablet maupun telepon pintar.
- **Custom User-Agent**: Memodifikasi *User-Agent* bawaan WebView untuk mencegah pemblokiran dari Google OAuth (*disallowed_useragent*), sehingga fitur **Google Login** di Live Chat dapat berfungsi dengan sempurna di dalam aplikasi Android.
- **Back Navigation Handling**: Menggunakan `OnBackPressedCallback` dari AndroidX untuk mengembalikan halaman web (*webView.goBack()*) saat tombol/gesture kembali ditekan, daripada langsung menutup aplikasi.

---

## 3. Integrasi Fitur Native

### A. Unggah Foto Profil (onShowFileChooser)
Saat pengguna mengklik tombol unggah foto profil di halaman pengaturan profil (yang merupakan elemen `<input type="file" />` HTML), WebView akan memicu `WebChromeClient.onShowFileChooser`. Aktivitas ini akan:
1. Membuka pemilih file sistem Android (*system file chooser*).
2. Memungkinkan pengguna memilih berkas gambar dari galeri perangkat.
3. Mengembalikan URI gambar tersebut kembali ke JavaScript untuk diproses, di-crop, dan diunggah ke Supabase.

### B. Unduhan Episode Anime (Download Listener)
Ketika pengguna menekan tombol unduh episode anime (file `.mp4`), aplikasi native Android menangkap URL unduhan secara langsung melalui `WebView.setDownloadListener` dan meneruskannya ke **Android DownloadManager**.
- Unduhan berjalan dengan aman di latar belakang (*background system service*).
- Menampilkan kemajuan (*progress bar*) di bilah notifikasi sistem Android.
- Menyimpan hasil unduhan secara otomatis di direktori penyimpanan publik `Downloads`.

---

## 4. Konfigurasi Gradle & SDK

Proyek Android ini dikonfigurasi dengan standar ekosistem modern:
- **Gradle Version**: `8.8`
- **Android Gradle Plugin (AGP)**: `8.2.1`
- **Compile SDK**: `34` (Android 14)
- **Minimum SDK**: `24` (Android 7.0 Nougat - kompatibel dengan lebih dari 99% perangkat Android aktif)
- **Target SDK**: `34` (Android 14)
- **Java Toolchain Compatibility**: Java 17

Seluruh file konfigurasi dapat diakses langsung pada direktori `/android/`.
