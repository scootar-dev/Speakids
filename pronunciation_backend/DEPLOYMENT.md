# Deploy SpeaKids melalui GitHub Actions

Pipeline: pull request menjalankan test; push `main` menjalankan test, build image Linux AMD64 ke GHCR, lalu deploy lewat SSH. Server tidak melakukan build. Image menggunakan digest immutable. Container wajib lolos `/ready`; kegagalan mencoba mengembalikan image sebelumnya. Ini deployment satu container, bukan zero-downtime.

## 1. Periksa server tanpa mengubah project lain

Jalankan:
```bash
uname -m
docker version
docker compose version
docker ps --format 'table {{.Names}}\t{{.Ports}}'
docker compose ls
sudo ss -ltnp | grep ':18080 ' || true
free -h
df -h
```

Butuh Linux x86_64, Docker Compose v2 yang mendukung `up --wait` dan `config --no-env-resolution`, serta kapasitas RAM/disk tersisa. Anggaran default service: 4 GB RAM, 2 CPU; bukan jaminan kebutuhan model. Jika port 18080 sudah terpakai, pilih port kosong dan set `SPEAKIDS_PORT` di `.env`. Jangan mengubah port project lama. Pastikan nama project Compose `speakids-pronunciation` belum digunakan.

Isolasi: folder `/opt/speakids-pronunciation`, network Compose sendiri, tanpa `container_name`, bind hanya localhost. Script tidak menjalankan `down`, `prune`, atau menghapus volume. Resource tetap berbagi host; sesuaikan batas RAM/CPU dengan kapasitas tersisa.

## 2. User dan folder deploy

Gunakan akun SSH khusus, misalnya `speakids-deploy`. Akses Docker setara hak root pada host; private key deploy harus disimpan sebagai GitHub Environment secret dan akses workflow dibatasi.

```bash
sudo adduser --disabled-password --gecos '' speakids-deploy
sudo usermod -aG docker speakids-deploy
sudo install -d -o speakids-deploy -g speakids-deploy -m 750 /opt/speakids-pronunciation
sudo install -d -o speakids-deploy -g speakids-deploy -m 700 /home/speakids-deploy/.ssh
```

Buat pasangan key khusus di komputer admin: `ssh-keygen -t ed25519 -f speakids-deploy`. Masukkan public key ke `/home/speakids-deploy/.ssh/authorized_keys` (owner akun tersebut, mode 600). Private key masuk secret GitHub, bukan repo. Login ulang agar group Docker aktif.

## 3. Konfigurasi backend dan model

Salin `pronunciation_backend/.env.example` ke `/opt/speakids-pronunciation/.env`, lalu edit langsung di server. Jangan commit file tersebut.

```dotenv
DEV_NO_AUTH=false
JWT_ISSUER=https://PROJECT.supabase.co/auth/v1
JWT_JWKS_URL=https://PROJECT.supabase.co/auth/v1/.well-known/jwks.json
JWT_AUDIENCE=authenticated
CORS_ORIGINS=https://appassets.androidplatform.net,https://DOMAIN-FRONTEND
MODEL_PATH=/models/phoneme
MODEL_DEVICE=cpu
MODEL_ALLOW_PICKLE=true
MODEL_VERSION=facebook-espeak-ae45363bf3413b374fecd9dc8bc1df0e24c3b7f4
SPEAKIDS_PORT=18080
SPEAKIDS_MEMORY=4g
SPEAKIDS_CPUS=2.0
```

`MODEL_ALLOW_PICKLE=true` hanya untuk checkpoint resmi yang sudah ditinjau. Untuk safetensors, gunakan false. Aktifkan Supabase Anonymous Sign-Ins jika murid tidak login, dan gunakan signing key asymmetric ES256/RS256. Masukkan URL/key publik Supabase pada konfigurasi aplikasi. Jangan memasukkan service-role key ke aplikasi.

Unduh model sekali di server memakai virtual environment khusus (paket `python3-venv` diperlukan):
```bash
cd /opt/speakids-pronunciation
python3 -m venv model-tools
model-tools/bin/pip install 'huggingface_hub==0.36.2'
model-tools/bin/python -c "from huggingface_hub import snapshot_download; snapshot_download('facebook/wav2vec2-lv-60-espeak-cv-ft', revision='ae45363bf3413b374fecd9dc8bc1df0e24c3b7f4', local_dir='model_cache/phoneme', allow_patterns=['*.json','pytorch_model.bin','README.md'])"
chmod 600 .env
chmod -R a+rX model_cache
```

Bobot sekitar 1.26 GB; sediakan ruang tambahan untuk image dan cache. Model berlisensi Apache-2.0; periksa README upstream. eSpeak sudah ada dalam image Docker, tidak perlu dipasang ke host. Container membaca model sebagai UID 10001, sehingga file perlu readable. Jangan simpan rekaman siswa di folder model.

## 4. GHCR dan GitHub Environment

Push project ke repository GitHub. Workflow tersedia di `.github/workflows/pronunciation.yml`; jika branch bukan `main`, ubah filter dan kondisi build.

Di repository: **Settings → Environments → New environment → `production`**. Batasi deployment ke branch `main`. Tambahkan secrets:

| Secret | Nilai |
|---|---|
| `SPEAKIDS_HOST` | IP atau hostname SSH server, tanpa `https://` |
| `SPEAKIDS_USER` | `speakids-deploy` |
| `SPEAKIDS_SSH_PORT` | Port SSH, biasanya `22` |
| `SPEAKIDS_SSH_KEY` | Seluruh isi private key khusus deploy |
| `SPEAKIDS_KNOWN_HOSTS` | Baris known_hosts server yang sudah diverifikasi |

Ambil candidate host key menggunakan `ssh-keyscan -p 22 HOST`. Verifikasi fingerprint melalui console/provider server sebelum menyimpan sebagai `SPEAKIDS_KNOWN_HOSTS`; workflow tidak menonaktifkan pemeriksaan host key. Jika port nonstandar, gunakan port tersebut saat scan.

Image bernama `ghcr.io/OWNER/REPOSITORY-pronunciation` (huruf kecil). Workflow memakai `GITHUB_TOKEN` untuk push, tidak perlu PAT untuk build. Pastikan organisasi mengizinkan GitHub Actions membuat package.

Untuk package privat, login **sebagai user deploy** di server menggunakan PAT classic khusus dengan `read:packages` dan akses package (SSO authorization jika diperlukan):
```bash
docker login ghcr.io -u GITHUB_USERNAME
```
Masukkan token pada prompt password. Jika package dibuat public, login pull tidak diperlukan. Token registry tinggal di server; bukan `.env` aplikasi atau repository.

## 5. Deploy pertama

Commit/push file CI/CD ke `main`, atau buka **Actions → SpeaKids pronunciation → Run workflow → main**. Syarat awal: `.env`, model, akses SSH dan registry sudah siap. CI melakukan test sebelum build. Server menjalankan hanya service `pronunciation` pada project `speakids-pronunciation`.

Jika deploy gagal pertama kali, tidak ada image sebelumnya untuk rollback. Periksa container dan perbaiki sebabnya, lalu jalankan workflow ulang:
```bash
cd /opt/speakids-pronunciation
export SPEAKIDS_IMAGE="$(cat current-image)" # Hanya jika pernah berhasil deploy
docker ps --filter label=com.docker.compose.project=speakids-pronunciation
docker logs --tail 100 "$(docker ps -aq --filter label=com.docker.compose.project=speakids-pronunciation --filter label=com.docker.compose.service=pronunciation)"
curl -f http://127.0.0.1:18080/health
curl -f http://127.0.0.1:18080/ready
```

Liveness 200 saja tidak cukup; readiness juga harus 200. Rollback hanya image, bukan model atau `.env`. Script memakai konfigurasi Compose yang baru; perubahan Compose yang tidak kompatibel perlu dipulihkan secara manual.

## 6. HTTPS tanpa mengganggu project lama

Tambahkan hostname baru, misalnya `speech.example.com`, ke reverse proxy yang **sudah digunakan server**. Jangan menjalankan Nginx/Caddy kedua di port 80/443. Tambahkan DNS menuju server dan sertifikat untuk hostname baru.

Jika Nginx berjalan di host, tambahkan location ke virtual host HTTPS baru:
```nginx
location / {
    client_max_body_size 2m;
    proxy_connect_timeout 10s;
    proxy_read_timeout 60s;
    proxy_pass http://127.0.0.1:18080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
Validasi `sudo nginx -t` sebelum reload. Jangan menimpa virtual host project lama.

Jika reverse proxy juga berupa container, `127.0.0.1` di container bukan host. Konfigurasi di atas tidak berlaku langsung. Sambungkan proxy ke network `speakids-pronunciation_default` melalui konfigurasi Compose milik proxy (external network), gunakan upstream `pronunciation:8000`, dan pastikan alias tidak bentrok; alternatif sesuaikan routing host sesuai proxy. Integrasi ini perlu disesuaikan dengan Nginx Proxy Manager/Traefik/Caddy yang dipakai. Jangan membuka port backend ke internet untuk mengatasi masalah routing.

Uji `https://speech.example.com/ready`, lalu build aplikasi:
```bash
flutter build apk --dart-define=PRONUNCIATION_API_URL=https://speech.example.com
```
Untuk browser, isi `SPEAKIDS_PRONUNCIATION.baseUrl` di `assets/app/config.js`. Workflow ini hanya deploy backend, bukan APK atau frontend.

## 7. Rollback manual

```bash
cd /opt/speakids-pronunciation
bash deploy.sh "$(cat previous-image)"
```

Model tetap baseline riset: skor null dan `can_pass=false` sampai scoring dikalibrasi. Deployment sehat tidak berarti penilaian anak sudah tervalidasi. Uji mikrofon HP, auth, dan respons audio setelah HTTPS aktif.
