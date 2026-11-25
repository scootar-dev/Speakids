# SpeaKids

## Pembaruan aplikasi siswa

- Kategori aktif: Alphabet, Vocabulary, dan Simple Sentences (15 level). Daily tidak lagi ditampilkan pada aplikasi maupun editor admin. ID lama dipertahankan agar data Supabase tidak bergeser.
- Profil siswa tidak lagi menampilkan akun cloud, formulir Project URL/key, atau papan peringkat.
- Konfigurasi Supabase untuk APK berada di **`assets/app/config.js`**. Isi `url` dan `anonKey` dengan Project URL dan publishable key sebelum build. Jangan gunakan secret/service-role key. Konfigurasi admin di browser tidak otomatis masuk ke APK.
- Ikon Android berasal dari `assets/logospeakidz.png`; lima ukuran launcher sudah dibuat.
- Verifikasi terbaru: 37 pengujian browser lulus, `flutter analyze` bersih, build APK debug berhasil.

Bagian panduan lama terkait menu akun cloud di bawah hanya berlaku untuk versi sebelumnya; konfigurasi siswa sekarang melalui berkas di atas.

SpeaKids adalah permainan belajar bahasa Inggris untuk siswa SD. Piko si burung hantu menemani anak mengenal huruf, kosakata, ungkapan sehari-hari, dan kalimat sederhana.

## Langsung mencoba di Windows

Ada dua cara mudah mencoba SpeaKids di Windows:

1. **Dengan Server Lokal (Rekomendasi Utama)**:
   Klik dua kali **`Jalankan-Web.cmd`**. Server lokal akan berjalan di `http://localhost:3000` dan otomatis membuka Google Chrome. Di mode ini, **fitur mikrofon dan suara (Web Speech API) aktif penuh** tanpa batasan browser.
2. **Langsung Buka Berkas HTML**:
   Buka **MULAI-DI-SINI.html** di browser Chrome atau Edge, lalu pilih **Mulai petualangan**.

## Menghubungkan ke Database Supabase (Cloud Sync)

SpeaKids sudah dilengkapi modul Supabase untuk menyimpan progres siswa ke cloud database:
1. Jalankan skrip SQL di berkas **`supabase_schema.sql`** pada SQL Editor di dashboard Supabase Anda.
2. Buka aplikasi SpeaKids -> masuk ke menu **Profil** -> **Akun Cloud Supabase**.
3. Masukkan **Project URL** dan **Anon Public Key** Supabase Anda.
4. Siswa dapat mendaftar (*Register*) atau masuk (*Login*). Jika konfirmasi email aktif, konfirmasi email sebelum masuk. Progres lokal tiap akun dipisahkan dari profil tamu.
5. Jalankan ulang **seluruh `supabase_schema.sql` versi terbaru**, termasuk fungsi `speakids_snapshot` dan `speakids_sync`. Skrip dapat dijalankan ulang. Sinkronisasi memakai REST API langsung, tanpa SDK CDN, dengan transaksi database dan deduplikasi riwayat.
6. Perubahan disinkronkan otomatis setelah jeda singkat; tombol **Sinkronkan Sekarang** meminta sinkronisasi manual. Ini bukan subscription real-time. Progres level dan total bintang tidak diturunkan oleh unggahan lama; total bintang memakai nilai maksimum, bukan penjumlahan aktivitas offline serentak dari beberapa perangkat.

Project URL dan anon/publishable key perlu diisi melalui Profil. Tidak perlu service-role key. Tanpa konfigurasi cloud, fitur lokal tetap berjalan. Koneksi proyek Supabase nyata perlu diuji setelah konfigurasi diisi.

## Admin materi

Buka **http://localhost:3000/admin/index.html** setelah menjalankan server lokal. Admin dapat menambah, mengubah, mengurutkan, dan menghapus kartu pada empat kategori × lima level. Terapkan **`supabase_content.sql`** setelah skema utama, lalu tetapkan akun pengelola pada `content_admins`. Panduan lengkap: **[ADMIN.md](ADMIN.md)**. Siswa dapat membaca materi terbit tanpa login.

## Galeri desain

**desain/Galeri.html** menampilkan 24 tampilan yang mencakup 19 layar atau kelompok layar dalam brief, termasuk enam keadaan latihan bicara. Pilih layar dari daftar, lalu gulir di dalam bingkai ponsel. Galeri berisi contoh keadaan aplikasi. Untuk mengerjakan misi, gunakan tombol **Coba aplikasi interaktif**. Folder yang sama memuat tiga gambar rancangan PNG berukuran 780 × 1620 piksel untuk Beranda, Belajar, dan Permainan.

## Menjalankan proyek Flutter untuk Android

Paket menggunakan Flutter untuk jendela aplikasi, area aman, dan navigasi tombol kembali Android. Satu antarmuka HTML, CSS, dan JavaScript di dalam Android WebView menampilkan materi yang sama dengan pratinjau. Kode Kotlin menghubungkan tombol mikrofon dengan pengenal suara Android. Proyek memakai Flutter SDK tanpa dependensi plugin pihak ketiga.

1. Siapkan Flutter 3.29 atau lebih baru dengan Dart 3.7+, Android SDK, dan emulator atau HP Android yang sudah terhubung. Jalankan `flutter doctor` untuk memeriksa lingkungan.
2. Pada Windows, buka **Jalankan-Android.cmd**. Skrip membuat runner Android dari templat Flutter yang terpasang, menyiapkan aset, lalu menjalankan aplikasi. Pembuatan pertama dapat memerlukan internet untuk mengunduh komponen build.
3. Untuk menjalankan langkah yang sama dari terminal, buka folder yang memuat `pubspec.yaml` dan gunakan perintah berikut.

```sh
dart tool/setup_android.dart
flutter pub get
flutter run
```

Jika beberapa perangkat terdeteksi, jalankan `flutter devices`, lalu `flutter run -d ID_PERANGKAT`. Untuk membuat APK uji setelah setup, gunakan `flutter build apk --debug`. Berkas hasilnya berada di `build/app/outputs/flutter-apk/app-debug.apk`.

Setup awal menggunakan `flutter create` di direktori sementara dan menyalin runner ke folder `android/` bersama integrasi mikrofon. Setup berikutnya melewati folder Android yang sudah ada. Build debug dan analisis Flutter sudah lulus. `flutter run -d RRCY302VWGH --no-resident` berhasil memasang APK dan memulai engine, lalu koneksi perangkat terputus. Mikrofon fisik belum terverifikasi.

Target Flutter saat ini Android, karena memakai `AndroidView`. Gunakan `flutter devices`, lalu `flutter run -d ID_PERANGKAT_ANDROID`. Untuk browser gunakan `Jalankan-Web.cmd`, bukan `flutter run -d chrome`.

WebView sekarang menyajikan aset melalui origin HTTPS lokal `appassets.androidplatform.net` agar fetch cloud memiliki origin web yang valid. Penyimpanan lokal pada origin `file://` versi lama tidak otomatis berpindah; data lama tidak dihapus, tetapi tidak muncul pada origin baru.

## Alur belajar

- **Beranda** membuka **Belajar**, melanjutkan misi aktif, dan memperlihatkan level serta ringkasan reward. Anak dapat mengubah nama panggilan dan kelas di Profil.
- **Belajar** menyediakan empat kategori dengan lima level per kategori. Level pertama di setiap kategori terbuka sejak awal. Nama huruf dan contoh kata memiliki rekaman yang terpisah.
- Anak menjelajahi kartu, mengenali jawaban, menyusun huruf atau kata, berlatih mengucapkan, lalu menyelesaikan tiga soal tantangan akhir. Anak dapat mencoba lagi. Tombol kembali menyimpan posisi kartu atau misi. Tantangan akhir menyimpan nomor soal yang sedang dikerjakan.
- Lima misi dan tiga jawaban akhir yang benar membuka level berikutnya. Setiap level baru yang selesai menambah tiga bintang. Mengulangi level melatih kembali materi dan tercatat di riwayat.
- **Permainan** memiliki empat pilihan dengan sepuluh soal per sesi. Jawaban yang akhirnya benar mendapat satu bintang per soal. Sesi menyimpan hasil ketika anak menyelesaikan sepuluh soal dan memilih **Lihat hasil**.
- **Bicara & Skor** membandingkan kata yang dikenali dengan target. Ini mengukur kecocokan hasil pengenalan suara. Konfirmasi pendamping menyelesaikan latihan secara terpisah dari skor pengenalan otomatis. Jika lima atau lebih ucapan dikenali dalam satu sesi, anak memperoleh lencana Speaking Star.
- **Reward** menunjukkan syarat lencana. **Profil** memuat pengaturan audio, riwayat 100 kegiatan terakhir, dan bantuan. Bintang permainan terpisah dari syarat membuka level.

## Audio dan data

Aplikasi memuat 89 rekaman contoh bahasa Inggris dari folder audio. Pengenalan suara memakai layanan yang tersedia pada Android atau browser. Android meminta mode luring jika layanan mendukungnya. Dukungan bahasa Inggris, kebutuhan koneksi, dan pemrosesan audio mengikuti layanan perangkat. Pendamping dapat menggunakan contoh suara lokal ketika pengenal suara tidak tersedia.

Aplikasi menyimpan progres dan profil pada perangkat. Aplikasi tidak menulis rekaman mikrofon atau transkrip ke riwayat. Penyimpanan browser dan aplikasi Android masing-masing memiliki progres sendiri.

## Letak berkas utama

| Lokasi | Isi |
| --- | --- |
| `lib/main.dart` | Aplikasi Flutter dan penanganan tombol kembali |
| `tool/android_template/MainActivity.kt` | WebView, izin mikrofon, dan pengenal suara Android |
| `tool/setup_android.dart` | Pembuatan runner Android |
| `assets/app/content.js` | Materi, ilustrasi kata, dan pemetaan audio |
| `assets/app/app.js` | Layar, misi, permainan, skor, dan penyimpanan |
| `assets/app/artwork.js` dan `style.css` | Ilustrasi antarmuka, lanskap, komponen, dan tata letak |
| `assets/app/art/` dan `audio/` | Aset gambar, tipografi, dan audio lokal |
| `desain/` | Galeri layar dan rancangan PNG |
| `lisensi/` | Keterangan aset pihak ketiga |

Gambar burung hantu berasal dari lampiran pengguna. Emblem menu, lanskap, dan ilustrasi adegan sekolah dibuat untuk SpeaKids. Ilustrasi objek memakai glif warna Noto Emoji. Teks memakai Open Sans. Contoh suara disintesis dengan CMU Flite.
