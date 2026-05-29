# Dokumentasi Vlow.ai - Client Dashboard & AI Backend 🚀

Selamat datang di pusat dokumentasi teknis Vlow.ai. Dokumentasi ini dibuat untuk memandu *developer* dan *maintainer* memahami struktur, arsitektur, dan fitur-fitur kompleks yang ada di balik aplikasi *dashboard* dan logika AI Vlow.

## 📑 Daftar Isi

Kumpulan dokumen ini dipecah menjadi beberapa bagian spesifik agar mudah dibaca:

### 1. [Arsitektur & Gambaran Sistem](architecture.md) 🏗️
Penjelasan mengenai tumpukan teknologi (*Tech Stack*) yang digunakan dan bagaimana data mengalir dari WhatsApp/Meta ke N8N, lalu ke LLM, dan kembali ke Backend Vlow.

### 2. [Panduan Fitur & Logika Mendalam](features.md) 🧠
Penjelasan mendetail mengenai cara kerja fitur-fitur pintar Vlow:
- **Smart Lead Qualification** (Penentuan suhu Cold/Warm/Hot otomatis).
- **Human Handover System** (Sistem pengambilalihan *chat* oleh admin).
- **Knowledge Base & MinIO RAG** (Pengiriman berkas dan ekstraksi konteks).
- **CRM & Broadcast** (Ekstraksi nama/kebutuhan dan pengiriman pesan massal).

### 3. [Skema Database (PostgreSQL)](database.md) 💾
Dokumentasi struktur *database*, relasi antar tabel (seperti `Agents`, `ConnectedPlatforms`), dan penjelasan fungsi JSONB pada konfigurasi.

### 4. [Deployment & DevOps (Proxmox)](deployment.md) ⚙️
Panduan cara mendeploy aplikasi menggunakan *Docker Compose*, Nginx, serta konfigurasi *Environment Variables*.

---

*Dokumentasi ini dikelola secara rapi dalam format Markdown. Silakan klik tautan di atas untuk membaca dokumen yang spesifik.*
