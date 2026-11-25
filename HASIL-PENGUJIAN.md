# Hasil audit SpeaKids

## Pembaruan ikon dan kategori

Ikon launcher lima density dibuat dari `assets/logospeakidz.png`. Daily dihilangkan dari menu, peta progres, lencana, dan editor admin; resume lama diarahkan ke Alphabet. Profil kini menghitung tiga kategori dan tidak menampilkan konfigurasi cloud. Pengujian terbaru: **37 lulus, 0 gagal**, termasuk 15 level aktif dan pemeriksaan penghapusan Daily/menu cloud. `flutter analyze` serta `flutter build apk --debug` lulus. Tampilan ikon pada launcher HP belum diverifikasi langsung.

## Penambahan admin materi

Halaman `admin/index.html`, skema `supabase_content.sql`, serta pemuatan materi publik pada aplikasi siswa sudah ditambahkan. Hasil terbaru: **41 pengujian browser lulus**, termasuk CRUD admin dengan endpoint simulasi; pengujian SQL PGlite juga lulus untuk admin/non-admin, konflik revisi, publikasi dan penghapusan isi level. Setup proyek hosted belum dilakukan. Panduan dan batas cakupan: `ADMIN.md`.

## Pembaruan setelah perbaikan

Bagian audit awal di bawah adalah catatan historis, bukan status kode terbaru.

- Startup diperbaiki dengan membungkus JavaScript dalam scope privat; `top()` tidak lagi berbenturan dengan `window.top`.
- Server root diarahkan ke path aplikasi; URL rusak dan range audio tidak valid ditangani.
- Izin INTERNET ditambahkan pada manifest utama dan generator Android.
- WebView dan template memakai origin HTTPS lokal untuk aset.
- SDK CDN dihapus; REST client mencakup timeout, refresh sesi, validasi konfigurasi, error HTTP, konfirmasi email, antrean unggahan, dan pembatalan hasil akun lama.
- Progres tamu/akun dipisahkan. Pengaturan audio dan lencana speaking dipulihkan.
- RPC SQL transaksional menjaga progres tidak mundur, menghapus checkpoint level selesai, serta mencegah duplikasi riwayat berdasarkan identitas stabil. Skrip SQL dapat diterapkan ulang.
- **39 pengujian browser lulus, 0 gagal**, tanpa workaround startup. Harness hanya mengekspos scope privat untuk inspeksi state. Halaman root juga diuji tanpa instrumentasi.
- **Pengujian SQL PGlite lulus**: penerapan dua kali, RPC terautentikasi, riwayat idempoten, progres monoton, audio/lencana, pembersihan checkpoint dan RLS antarakun.
- `flutter analyze`: lulus, tanpa masalah.
- `flutter build apk --debug`: lulus.
- `flutter run -d RRCY302VWGH --no-resident`: APK terpasang dan engine/WebView mulai dimuat pada SM A566B; kemudian `Lost connection to device`. Pemeriksaan adb berikutnya menunjukkan perangkat tidak terhubung. Tampilan dan mikrofon fisik belum terverifikasi.
- Supabase hosted belum diuji: Project URL/key dan akun nyata belum tersedia. Terapkan ulang `supabase_schema.sql` terbaru sebelum menggunakan cloud.

Pengujian ulang:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\Users\ARFAZU~1\AppData\Local\Temp\opencode\node_modules\playwright'
node tool/audit.cjs
$env:PGLITE_MODULE = 'C:\Users\ARFAZU~1\AppData\Local\Temp\opencode\node_modules\@electric-sql\pglite'
node tool/audit_database.cjs
```

Catatan: bintang cloud memakai maksimum per perangkat, bukan agregasi aktivitas offline simultan. Perubahan origin Android membuat penyimpanan `file://` lama tidak otomatis terlihat pada versi baru. Lihat README.

---

## Audit awal sebelum perbaikan

Tanggal: 20 November 2026.

## Kesimpulan

**Belum semua fitur berjalan. Koneksi database Supabase nyata belum terverifikasi.**

Chrome gagal menjalankan aplikasi asli karena `Identifier 'top' has already been declared`. Halaman aplikasi kosong. Build Android berhasil, tetapi build tidak memeriksa keberhasilan JavaScript dalam WebView.

## Cakupan folder

| Folder | Isi dan pemeriksaan |
|---|---|
| `assets/` | Antarmuka HTML/CSS/JavaScript, materi, integrasi cloud, gambar/font, 89 audio; sumber utama pengujian browser. |
| `lib/` | Flutter AndroidView, navigasi kembali; diperiksa melalui pembacaan kode dan `flutter analyze`. |
| `android/` | Runner, Kotlin WebView, mikrofon, manifest dan Gradle; debug APK dibangun. |
| `tool/` | Setup Android dan template integrasi native; ditambah skrip audit. |
| `desain/` | Galeri HTML dan tiga rancangan PNG; galeri berisi contoh statis, bukan bukti fitur interaktif berjalan. |
| `lisensi/` | Keterangan lisensi Apache, Flite, Noto Emoji, Open Sans. |
| `.dart_tool/` | Metadata/cache Flutter; bukan sumber fitur aplikasi. |
| `build/` | Keluaran build, termasuk APK; bukan sumber fitur aplikasi. |

Berkas root diperiksa: README, pubspec, server Node, launcher Windows, halaman pembuka, dan skema SQL. Pembacaan berfokus pada sumber aplikasi dan konfigurasi; berkas biner/cache tidak dibaca seluruh byte maupun setiap berkas hasil generasi.

## Pengujian yang dijalankan

Lingkungan: Node.js 24.14.0, Flutter 3.44.0, Dart 3.12.0, Chrome headless melalui Playwright. Browser memakai profil pengujian baru; penyimpanan pengguna tidak dibaca atau diubah.

| Pemeriksaan | Hasil |
|---|---|
| `flutter analyze` | Lulus, tidak ada masalah. |
| `flutter build apk --debug` | Lulus; `build/app/outputs/flutter-apk/app-debug.apk`. |
| Browser, sumber asli | 1 lulus, 37 gagal. Mayoritas kegagalan turunan dari aplikasi gagal startup; bukan 37 bug terpisah. |
| Browser, workaround diagnostik sementara | 35 lulus, 3 gagal. Penggantian `top()` menjadi `appTop()` hanya pada respons JavaScript browser pengujian. Sumber aplikasi tetap asli. |
| 20 level, masing-masing lima misi | Lulus dengan workaround; jawaban salah, susun huruf/kata, latihan pendamping, tiga soal akhir. |
| Progres dan reward | Lulus dengan workaround; level terkunci, lanjut misi, checkpoint setelah reload, total 60 bintang, ulang level tanpa tambahan bintang. |
| Empat permainan × 10 soal | Lulus dengan workaround; penyelesaian dan tambahan bintang. |
| Speaking | Logika skor/lencana, transkrip salah, hasil kedaluwarsa, dan pendamping lulus dengan workaround. Transkrip disimulasikan; mikrofon nyata belum diuji. |
| Profil dan navigasi | Lulus dengan workaround; nama/kelas, pengaturan audio, bantuan, lencana, dialog cloud dan riwayat. |
| Penyimpanan lokal | Lulus dengan workaround; bertahan setelah reload dan batas 100 riwayat. |
| Audio | 89 berkas terpetakan tersedia; contoh Apple berhasil didekode dan diputar Chrome. Tidak seluruh audio diuji pendengaran. |
| Supabase langsung | Terblokir: URL/key bawaan kosong; tidak ada akun uji/endpoint aktif yang diberikan. |
| Penolakan database, mock | Gagal: `pushUserData()` tetap resolve ketika upsert mengembalikan error RLS. |
| Riwayat cloud, mock | Gagal: dua push data sama menghasilkan dua insert riwayat. |
| URL root server `/` | Gagal: halaman kosong; referensi relatif meminta `/content.js`, `/app.js`, dll. bukan `/assets/app/...`. |

HP Android SM A566B terdeteksi oleh `flutter devices`. APK tidak dipasang ke HP; runtime Android, izin mikrofon, dan pengenalan suara fisik belum diuji.

## Temuan prioritas

### 1. Kritis: aplikasi browser tidak bisa startup

`assets/app/app.js:92`: deklarasi global `function top()` berbenturan dengan properti browser `window.top`. Error tertangkap langsung melalui Playwright. Ganti nama fungsi beserta pemanggilnya agar tidak berbenturan.

### 2. Database belum terbukti terhubung

`assets/app/supabase.js:6-9`: `url` dan `anonKey` kosong. Browser baru menghasilkan `SpeaCloud.isReady() === false`. Konfigurasi bisa disimpan di localStorage browser pengguna; audit ini tidak mengakses profil browser pribadi, sehingga tidak menyimpulkan status konfigurasi pada perangkat lain.

Skema SQL menyediakan `profiles`, `student_progress`, `learning_history`, RLS, trigger profil, serta view leaderboard. Keberadaan berkas SQL tidak membuktikan skema telah diterapkan ke server.

`isReady()` hanya memeriksa objek client, bukan koneksi jaringan atau keberadaan tabel. Label akun tersambung juga bukan bukti transaksi berhasil.

### 3. Tinggi: sinkronisasi bisa melaporkan sukses palsu

`assets/app/supabase.js:164-211`: hasil `{ error }` dari upsert/insert tidak diperiksa; catch juga hanya menulis peringatan. Mock penolakan RLS membuktikan promise tetap resolve. `assets/app/app.js:713-732` kemudian bisa menampilkan sukses.

### 4. Tinggi: riwayat cloud berulang

`assets/app/supabase.js:199-207`: setiap push memasukkan item teratas tanpa identitas unik/deduplikasi. Dua push sama terbukti menghasilkan dua insert. `save()` dipanggil pada checkpoint dan pengaturan, sehingga duplikasi bukan hanya saat menyelesaikan pelajaran.

### 5. Tinggi: akses internet Android rilis belum disiapkan

`android/app/src/main/AndroidManifest.xml` tidak memuat izin `android.permission.INTERNET`; izin ada di manifest debug. Cloud serta SDK Supabase eksternal memerlukan internet. Temuan dari inspeksi manifest, bukan pengujian APK rilis.

### 6. Risiko sinkronisasi berdasarkan kode

- `app.js:716-725`: sinkronisasi manual mengunggah dahulu sebelum menarik cloud; progres cloud yang lebih baru berpotensi tertimpa.
- `app.js:809-824` dan `851-867`: `audio` dan `speaking` hasil pull tidak diterapkan, sehingga pengaturan audio/lencana speaking tidak dipulihkan dari cloud.
- Logout tidak menghapus/memisahkan progres lokal per akun; login akun lain memakai nilai maksimum dari profil lokal yang sama.
- README menyebut real-time, tetapi tidak ditemukan subscription realtime; implementasi berupa pull/push pada tindakan tertentu.
- Registrasi menganggap `data.user` sebagai pengguna aktif meski konfirmasi email mungkin masih diperlukan; skenario tersebut belum diuji terhadap Supabase nyata.

### 7. URL root server rusak

`server.js:24-25` menyajikan HTML aplikasi di `/` tanpa redirect/base URL. Gunakan redirect ke `/assets/app/index.html` atau perbaiki resolusi aset. Launcher sudah membuka path lengkap, tetapi tetap terkena bug startup nomor 1.

## Menjalankan ulang audit

Pasang Playwright di lokasi dependensi pengujian. Modul ini bukan dependensi Flutter.

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\Users\ARFAZU~1\AppData\Local\Temp\opencode\node_modules\playwright'
$env:AUDIT_WORKAROUND = '0'
node tool/audit.cjs
```

Untuk memeriksa logika fitur di balik bug startup tanpa mengubah sumber aplikasi:

```powershell
$env:AUDIT_WORKAROUND = '1'
node tool/audit.cjs
```

Workaround hanya berlaku pada halaman utama pengujian; uji root memakai halaman terpisah dengan sumber asli. Exit code audit bernilai 1 bila ada kegagalan.

## Kebutuhan pengujian database lanjutan

Project URL, anon/publishable key, skema yang sudah diterapkan, serta akun uji khusus. Tidak perlu service-role key. Pengujian berikutnya: register/konfirmasi email, login/logout, insert dan read-back progres, reload/perangkat kedua, leaderboard, isolasi RLS antarakun, error jaringan, serta konflik sinkronisasi.

## Berkas ditambahkan

- `tool/audit.cjs`: pengujian browser dan mock cloud yang dapat dijalankan ulang.
- `HASIL-PENGUJIAN.md`: laporan ini.

Audit tidak memperbaiki sumber aplikasi. Build debug memperbarui keluaran build lokal.
