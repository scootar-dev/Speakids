# Admin materi SpeaKids

Pembaruan: editor kini menyediakan tiga kategori aktif (Alphabet, Vocabulary, Simple Sentences), masing-masing lima level. Daily disembunyikan; ID kategori database tetap 0, 1, 3. Untuk APK siswa, isi konfigurasi publik di `assets/app/config.js` sebelum build; formulir Supabase sudah dihapus dari profil siswa.

## Menjalankan

1. Jalankan `node server.js` atau `Jalankan-Web.cmd`.
2. Buka **http://localhost:3000/admin/index.html**.
3. Masukkan Project URL dan publishable/anon key. Jika sudah diisi pada aplikasi siswa di origin browser yang sama, konfigurasi otomatis muncul.

Admin berupa HTML/CSS/JavaScript ringan dan REST Supabase. Tidak membutuhkan PHP, Laravel, atau Filament.

## Setup database dan akun admin

1. Di Supabase SQL Editor, jalankan `supabase_schema.sql`, kemudian **`supabase_content.sql`**. Keduanya dapat dijalankan ulang.
2. Buka **Authentication → Users → Add user**, buat akun email/password pengelola. Pastikan email sudah dikonfirmasi.
3. Salin UUID akun tersebut, kemudian jalankan SQL berikut, mengganti placeholder dengan UUID asli:

```sql
insert into public.content_admins(user_id)
values ('UUID_AKUN_ADMIN')
on conflict do nothing;
```

4. Masuk ke halaman admin menggunakan email/password akun tadi.

Publishable key tidak memberikan hak mengubah materi. Penulisan hanya melalui fungsi database yang memeriksa keanggotaan `content_admins`. Akun siswa dan pengguna anonim tidak bisa menambah dirinya sebagai admin. Jangan memasukkan service-role/secret key ke halaman web.

## Pengelolaan materi

- Pilih salah satu dari empat kategori dan level 1–5.
- Materi bawaan langsung terlihat bila level belum mempunyai baris database. Klik **Simpan & terbitkan** untuk memasukkannya ke Supabase.
- **Tambah kartu** menambah item belajar. **Hapus kartu** menghapus item dari formulir; perubahan baru berlaku setelah disimpan. **Naik** mengubah urutan kartu.
- Alphabet hanya membutuhkan huruf A–Z. Kategori lain memakai teks Inggris, arti Indonesia, dan emoji opsional.
- Setiap level terbit memerlukan **3–100 kartu unik** supaya misi pilihan jawaban dan susun kata tetap valid.
- **Simpan & terbitkan** mengganti isi level di database.
- **Hapus isi level** meminta konfirmasi, menghapus kartu dalam database, dan menyimpan penanda level nonaktif. Penanda ini mencegah materi bawaan muncul kembali saat database dibaca. Level bisa diisi dan diterbitkan lagi.
- Jika admin lain lebih dulu mengubah level, penyimpanan ditolak. Muat ulang sebelum mengedit lagi.

## Aplikasi siswa

Siswa tidak perlu login untuk membaca materi. Project URL/key tetap harus tersedia di konfigurasi aplikasi/perangkat siswa. Konfigurasi browser admin tidak otomatis berpindah ke HP Android atau komputer lain.

Saat aplikasi dibuka ulang, materi diambil dari `learning_levels`. Pembaruan tidak mengganti soal di tengah sesi latihan aktif. Checkpoint level yang materinya berubah dihapus; bintang dan level yang sudah selesai dipertahankan.

Level belum dikelola di database tetap memakai materi bawaan. Jika database gagal diakses, aplikasi memakai materi lokal dan menampilkan pemberitahuan. Karena fallback tersebut, perubahan/penghapusan cloud belum dijamin terlihat saat perangkat offline.

Materi Vocabulary juga menjadi sumber permainan jika tersedia minimal 10 kartu. Jika kurang, permainan memakai kumpulan bawaan. Bank soal permainan belum mempunyai editor terpisah.

Speaker memakai rekaman lokal jika tersedia, lalu Web Speech synthesis untuk teks baru. Ketersediaan suara sintetis bergantung browser/WebView; perangkat tanpa dukungan akan menampilkan pemberitahuan. Admin belum menyediakan unggahan audio/gambar; ilustrasi berupa emoji. Alphabet tetap tanpa gambar.

## Verifikasi

- 41 pengujian browser lulus, termasuk formulir admin, publish, edit, hapus, dan pembacaan materi siswa. Endpoint Supabase pada pengujian browser disimulasikan.
- SQL diuji pada PostgreSQL lokal melalui PGlite: migrasi dua kali, admin CRUD, revisi bersamaan, baca publik, larangan penulisan non-admin, dan level nonaktif.
- Proyek Supabase hosted pengguna belum diuji langsung; setup SQL dan akun admin harus diselesaikan terlebih dahulu.
