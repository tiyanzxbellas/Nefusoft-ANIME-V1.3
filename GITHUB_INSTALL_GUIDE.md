# Panduan Cara Build APK lewat GitHub Actions & Cara Install

Panduan ini ditujukan bagi Anda yang ingin mengonversi proyek web NefuSoft menjadi aplikasi Android (APK) siap pakai tetapi **tidak memiliki komputer atau laptop**. Kita akan memanfaatkan **GitHub Actions** untuk melakukan proses kompilasi (*build*) secara otomatis di server cloud GitHub.

---

## Bagian 1: Cara Build APK Menggunakan GitHub Actions

Ikuti langkah-langkah mudah berikut langsung dari browser HP Anda:

1. **Fork Repositori Ini**:
   - Masuk ke akun GitHub Anda.
   - Buka repositori proyek ini, lalu klik tombol **Fork** di pojok kanan atas untuk menyalin repositori ini ke akun Anda sendiri.

2. **Aktifkan GitHub Actions**:
   - Di repositori hasil Fork Anda, buka tab **Actions** (di bagian menu atas sebelah *Pull Requests*).
   - Jika muncul tombol hijau bertuliskan *"I understand my workflows, go ahead and enable them"*, klik tombol tersebut untuk mengaktifkan fitur build otomatis.

3. **Jalankan Proses Build Secara Manual**:
   - Di sidebar sebelah kiri tab Actions, pilih menu **Build Android APK**.
   - Klik tombol dropdown **Run workflow** di sebelah kanan layar.
   - Pilih branch utama (biasanya `main` atau `master`), lalu klik tombol hijau **Run workflow** untuk memulai proses kompilasi.

4. **Tunggu Proses Build Selesai**:
   - Proses build APK akan dimulai (ditandai dengan ikon lingkaran kuning yang berputar).
   - Tunggu sekitar 2-3 menit hingga lingkaran berubah menjadi centang hijau (artinya kompilasi berhasil dilakukan).

5. **Unduh File APK**:
   - Klik pada nama workflow yang baru saja selesai dijalankan tersebut.
   - Gulir ke bawah hingga Anda melihat bagian **Artifacts**.
   - Klik pada berkas bernama **NefuSoft-Anime-Debug-APK** untuk mengunduhnya langsung ke HP Anda. File yang diunduh berupa file `.zip`.
   - Ekstrak file `.zip` tersebut di HP Anda untuk mendapatkan file pemasang bernama `app-debug.apk`.

---

## Bagian 2: Cara Menginstal APK di HP Android

Karena aplikasi ini dikompilasi secara mandiri dan tidak diunduh langsung dari Google Play Store, Anda perlu memberikan izin instalasi sumber tidak dikenal (*Unknown Sources*) di HP Anda:

1. **Buka Berkas APK**:
   - Cari berkas `app-debug.apk` yang telah diekstrak di pengelola file (*File Manager*) HP Anda.
   - Klik berkas tersebut untuk memulai instalasi.

2. **Izinkan Instalasi dari Sumber Tidak Dikenal**:
   - Jika HP Anda memunculkan peringatan keamanan seperti *"Instal aplikasi yang tidak dikenal"*, klik **Setelan** atau **Settings** pada pop-up tersebut.
   - Aktifkan toggle **Izinkan dari sumber ini** (*Allow from this source*) untuk aplikasi File Manager atau Browser Anda.

3. **Lanjutkan Instalasi**:
   - Kembali ke layar instalasi dan klik **Instal** (*Install*).
   - Tunggu beberapa detik hingga proses pemasangan selesai.

4. **Buka Aplikasi NefuSoft**:
   - Cari ikon aplikasi **NefuSoft** di laci aplikasi HP Anda.
   - Buka aplikasi tersebut, tunggu splash screen loading 2 detik selesai, dan nikmati fitur streaming anime gratis tanpa iklan dengan performa maksimal!
