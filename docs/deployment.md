# ⚙️ Deployment & DevOps (Proxmox/Docker)

Dokumen ini berisi panduan teknis bagi DevOps atau *SysAdmin* untuk melakukan *deployment*, pemeliharaan, dan *troubleshooting* aplikasi Vlow.ai di lingkungan *server* (Proxmox / Portainer).

## 🐋 Arsitektur Docker Compose

Aplikasi dideploy menggunakan Docker Compose untuk mengorkestrasi berbagai layanan menjadi satu kesatuan. Secara garis besar, `docker-compose.yml` mencakup kontainer-kontainer berikut:

1. **`vlow_server` (Express.js):** 
   - Backend utama.
   - Bergantung pada ketersediaan `db` (Postgres).
   - Membutuhkan port (misal: 3000) dan *volume* untuk sertifikat SSL jika perlu.
2. **`vlow_client` (React/Vite):**
   - Frontend *Dashboard* Vlow.
3. **`db` (PostgreSQL):**
   - Database persisten. Harus menggunakan *Docker Volume* untuk menjaga integritas data saat di-*restart*.
4. **`n8n`:**
   - Mesin automasi dan penghubung AI.
   - Harus memiliki akses ke PostgreSQL Vlow dan API WAHA/Meta.
5. **`waha`:**
   - WhatsApp HTTP API. Layanan terpisah dari N8N untuk me-*manage* sesi WhatsApp QR.
6. **`minio`:**
   - Penyimpanan berkas lokal berbasis obyek (mirip AWS S3).
   - Bergantung pada *volume* agar berkas RAG dan *profile picture* tidak hilang.

## 🔐 Environment Variables (.env)
Berikut adalah daftar *Environment Variables* krusial yang harus diperhatikan:

- **DATABASE_URL:** Format koneksi Postgres (contoh: `postgres://user:pass@host:port/dbname`). Digunakan oleh Vlow Server dan Node N8N.
- **JWT_SECRET:** Kunci enkripsi untuk otentikasi admin. Tidak boleh diganti setelah *production* agar admin tidak *logout* massal secara tiba-tiba.
- **N8N_WEBHOOK_URL:** URL *webhook* N8N utama.
- **WAHA_URL:** Endpoint *server* WAHA (biasanya http://waha:3000 di dalam Docker *network* internal).
- **MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY:** Kredensial *bucket* penyimpanan berkas.

## 🔄 Perintah Terminal Penting

Untuk melakukan perbaikan atau pembaruan (*update*), masuklah ke terminal *server* (melalui Proxmox Console atau SSH), lalu masuk ke direktori proyek Vlow.

### Update & Rebuild
Jika Anda baru saja melakukan *push* kode ke Github dan ingin me-*refresh* aplikasi di server:
```bash
# Tarik kode terbaru dari Github
git pull origin main

# Bangun ulang kontainer (tanpa menggunakan cache) dan nyalakan di background (-d)
docker-compose up -d --build
```

### Melihat Log Server (Troubleshooting)
Untuk melihat masalah (*error*) yang terjadi secara *real-time*:
```bash
# Melihat log backend Vlow
docker logs -f vlow_server

# Melihat log N8N (Berguna untuk melihat apakah LLM gagal)
docker logs -f n8n

# Melihat log WAHA (Berguna jika pesan WhatsApp tidak terkirim)
docker logs -f waha
```

### Merestart Layanan Spesifik
Jika fitur AI mati tetapi *dashboard* tetap menyala, kemungkinan N8N butuh di-*restart*:
```bash
docker restart n8n
```

## ⚠️ Tips Perawatan
- Jangan pernah menghapus *volume* Docker (`docker volume rm ...`) kecuali Anda ingin me-*reset* semua data klien, riwayat *chat*, agen, dan sesi WhatsApp!
- Jika *file* konfigurasi N8N (`n8n_crm_workflow_clean.json`) diperbarui dari Github, Anda harus secara manual mengimpornya ke antarmuka N8N web (misal di https://n8n.vlow-ai.com) agar *workflow* di *server* ter-*update*.
