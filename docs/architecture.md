# 🏗️ Arsitektur & Gambaran Sistem

Sistem Vlow.ai adalah ekosistem hibrida yang menggabungkan aplikasi *Fullstack Javascript* tradisional dengan *Automation Engine* (N8N) untuk memproses kecerdasan buatan (AI).

## 🛠️ Tech Stack Utama

1. **Frontend (Dashboard):** 
   - **Framework:** React.js dengan Vite.
   - **Styling:** Tailwind CSS.
   - **Fungsi Utama:** Antarmuka bagi pemilik bisnis untuk mengatur agen AI, memantau riwayat *chat*, *Live Chat* *real-time*, memantau analitik, dan mengirim pesan *broadcast*.

2. **Backend (Server):** 
   - **Framework:** Node.js dengan Express.js.
   - **Database:** PostgreSQL dengan ORM Sequelize.
   - **Komunikasi Real-time:** Socket.io (digunakan untuk *Live Chat* dan notifikasi status agen).
   - **Penyimpanan File:** MinIO (Alternatif S3) digunakan untuk menyimpan gambar profil, *knowledge base* berbentuk dokumen/gambar, dan file aset lainnya.

3. **Automation & AI Engine:**
   - **Engine:** N8N (Node-based automation).
   - **LLM:** Terhubung secara dinamis ke OpenAI atau Gemini melalui N8N.
   - **Fungsi Utama:** Menyusun *prompt*, merangkum memori obrolan, menginstruksikan AI, membedah (*parse*) JSON, dan mengeksekusi *webhook* kembali ke Vlow Backend.

4. **Konektor Pihak Ketiga (Platform):**
   - **WAHA (WhatsApp HTTP API):** Mengelola koneksi WhatsApp (via QR code) secara mandiri.
   - **Meta Cloud API:** Menggunakan infrastruktur resmi Meta untuk WhatsApp Business.

---

## 🔄 Alur Data Sistem (Data Flow)

Alur komunikasi dari klien/tamu ke AI dan kembali lagi sangat krusial untuk dipahami. Berikut adalah urutan perjalanan satu pesan masuk:

### 1. Klien Mengirim Pesan
- Pelanggan (*Customer*) mengirim pesan via WhatsApp.
- **WAHA / Meta Cloud API** menerima pesan tersebut dan meneruskannya (melalui Webhook) ke **N8N**.

### 2. Pemrosesan di N8N
- **Trigger:** N8N menerima *webhook payload*.
- **Database Query:** N8N menembak *query* SQL langsung ke tabel `Agents` di PostgreSQL Vlow untuk menarik *System Prompt*, konfigurasi Handover, konfigurasi Smart Lead, dan Knowledge Base terkini (tanpa harus membebani Express Backend).
- **Finalize Context (Code Node):** N8N menggabungkan pesan *user* dengan *System Prompt* dan meracik instruksi khusus (seperti memaksakan keluaran JSON untuk *Lead Temperature* atau ekstrak *CRM*).
- **LLM Execution:** N8N mengirim konteks gabungan ke AI (Gemini/OpenAI).
- **Parsing Output:** N8N membedah *output* AI. Teks balasan dipisahkan dari blok kode JSON tersembunyi.
- **HTTP Request (Kondisional):** Jika AI mengeluarkan JSON khusus (seperti suhu *Smart Lead* atau permintaan *Escalate/Handover*), N8N akan menembak *Webhook/REST API* kembali ke **Vlow Backend**.
- **Send Message:** N8N memerintahkan WAHA/Meta API untuk membalas pesan teks ke pelanggan.

### 3. Pemrosesan Sinkronisasi di Vlow Backend
- Di saat yang bersamaan, N8N juga mengirim *Webhook* (Log dan Status) ke `api.vlow-ai.com/api/webhook/n8n`.
- Vlow Backend menerima log pesan ini dan:
  1. Menyimpannya ke tabel `ConversationLogs`.
  2. Memancarkannya via **Socket.io** (`io.emit`) ke Vlow Dashboard.
  3. Memperbarui UI Live Chat milik admin secara *real-time*.

---

## 🔗 Keuntungan Arsitektur Ini
Dengan mendelegasikan pemrosesan AI sepenuhnya ke **N8N**, Vlow Backend (Node.js) tidak pernah terbebani oleh *latency* dari OpenAI/Gemini (yang bisa mencapai 5-10 detik per *request*). Hal ini membuat *dashboard* Vlow tetap sangat cepat dan responsif saat diakses oleh pengguna.
