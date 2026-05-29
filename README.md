# Vlow.ai - AI Agent Client Dashboard 🚀

Vlow.ai adalah platform *Live Chat* dan *Automation Engine* yang memungkinkan bisnis untuk mengintegrasikan asisten AI (Gemini/OpenAI) ke WhatsApp (WAHA) dan Meta Cloud API.

Repositori ini memuat aplikasi utama Vlow, yang terbagi menjadi:
- **Client (Frontend):** React.js + Vite + Tailwind CSS.
- **Server (Backend):** Node.js + Express + PostgreSQL + Sequelize.

## 📚 Dokumentasi Developer

Jika Anda ingin memahami cara kerja sistem secara mendalam, alur logika N8N, atau panduan *deployment*, silakan baca dokumentasi lengkap kami yang tersedia di direktori `docs`:

👉 **[Buka Dokumentasi Lengkap (Wiki) di sini!](./docs/README.md)**

### Topik Utama Dokumentasi:
1. **[Arsitektur & Gambaran Sistem](./docs/architecture.md):** Alur data dari WhatsApp -> N8N -> Backend.
2. **[Panduan Fitur & Logika Mendalam](./docs/features.md):** Pembahasan tentang *Smart Lead Qualification*, *Human Handover*, dan sistem *RAG MinIO*.
3. **[Skema Database](./docs/database.md):** Struktur tabel PostgreSQL dan penggunaan *JSONB*.
4. **[Deployment & DevOps](./docs/deployment.md):** Cara mem- *build* Docker, *update server* Proxmox, dan perintah *terminal* krusial.

## 🚀 Memulai (Local Development)

Untuk menjalankan proyek ini di mesin lokal (komputer) Anda:

1. Buat file `.env` di folder `server/` dan ikuti variabel yang dibutuhkan.
2. Jalankan perintah instalasi di kedua folder (Client dan Server):
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Nyalakan layanan (pastikan *database* Postgres lokal sudah menyala):
   ```bash
   # Di terminal 1 (Server)
   npm run dev

   # Di terminal 2 (Client)
   npm run dev
   ```

*Untuk panduan deployment ke server *production*, lihat [Panduan Deployment](./docs/deployment.md).*
