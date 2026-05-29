# 🧠 Panduan Fitur & Logika Mendalam

Dokumen ini membedah fitur-fitur kompleks di dalam Vlow.ai yang memanfaatkan kombinasi Backend, AI, dan Workflow.

## 1. Smart Lead Qualification 🔥

Fitur ini bertugas untuk memberikan suhu (Cold, Warm, Hot) secara otomatis pada pelanggan berdasarkan niat percakapan mereka.

### Mekanisme Kerja:
1. **Penyimpanan Konfigurasi:** Admin mengaktifkan fitur ini di UI (*Dashboard*) dan memilih label apa yang merepresentasikan Cold, Warm, dan Hot. Konfigurasi ini disimpan di kolom `leadQualificationConfig` (tipe `JSONB`) pada tabel `Agents`.
2. **Injeksi N8N:** N8N secara otomatis mengekstrak konfigurasi tersebut melalui *query* SQL. Jika aktif, N8N menyisipkan aturan ketat ke *System Prompt* (contoh: *"Kamu WAJIB mengevaluasi suhu minat user SECARA DINAMIS pada SETIAP pesan... Buat JSON khusus: `{"lead_temperature": "COLD|WARM|HOT"}`"*).
3. **Pengeksekusian Backend:**
   - Setelah AI membalas, N8N mengambil nilai `lead_temperature`.
   - N8N mengirim HTTP POST Request ke `/api/handover/lead-qualification` di Vlow Backend.
   - Vlow Backend mengeksekusi `wahaService.updateChatLabels()` (menggunakan API WAHA) untuk menghapus label suhu lama dan memasang label suhu baru.
4. **Otomatisasi Handover:** Jika AI memutuskan suhunya adalah **HOT**, backend Vlow akan memicu fungsi `activateHandover` secara instan, sehingga obrolan langsung dialihkan ke Admin (*Human Take Over*).

---

## 2. Human Handover System 🤝

Sistem pengambilalihan obrolan antara AI dan manusia, yang krusial untuk menangani kasus kompleks yang tidak bisa diselesaikan AI.

### Mekanisme Kerja:
1. **Trigger Utama:**
   - **Manual:** Admin mengklik tombol "Take Over" di *Dashboard Live Chat*.
   - **Otomatis (Escalation):** AI mendeteksi pertanyaan di luar konteks dan mengeluarkan output JSON `{"escalate": true, "reason": "..."}`.
   - **Otomatis (Lead Hot):** Seperti dijelaskan di atas.
2. **Tabel Database:** Mencatatnya di tabel `ChatHandovers` dengan status `ACTIVE` atau `RELEASED`.
3. **Penyetopan AI:** Setiap kali ada pesan baru dari N8N, Vlow Backend memeriksa apakah `chatId` tersebut sedang dalam status `ACTIVE` di `ChatHandovers`. Jika iya, N8N diinstruksikan untuk **mengabaikan/memblokir** balasan AI, sehingga hanya Admin yang membalas (via UI Live Chat).
4. **Auto-Release (Cron Job):** Terdapat sebuah *cron scheduler* (`server/utils/handoverScheduler.js`) yang terus berjalan setiap menit. Jika admin lupa menutup sesi *Take Over*, *cron job* ini akan memeriksa `autoReleaseMinutes` dari konfigurasi *agent*. Jika melebihi batas waktu (misal 30 menit tanpa aktivitas), status *handover* akan diubah menjadi `RELEASED`, dan AI mengambil kendali kembali.

---

## 3. Knowledge Base & MinIO RAG 📚

Sistem untuk memasok AI dengan informasi perusahaan (RAG - *Retrieval-Augmented Generation*).

### Mekanisme Kerja:
1. **Penyimpanan:** Admin mengunggah dokumen/teks. Vlow Backend tidak menyimpan berkas secara lokal, melainkan melemparnya ke layanan obyek penyimpanan **MinIO**.
2. **Proxy Image:** File di MinIO diakses via *endpoint* internal Vlow `/api/agents/proxy-image` untuk mem- *bypass* isu CORS atau privasi.
3. **Injeksi Otomatis:** URL atau teks dari basis pengetahuan tersebut disisipkan oleh N8N sebagai *Knowledge Context*. N8N memiliki logika khusus di `Finalize Context` yang memerintahkan AI: *"Jika user meminta file/gambar yang terlampir, balas dengan `[nama_file](URL)`"*. Hal ini memungkinkan AI mengirim gambar secara natural.

---

## 4. CRM & Broadcast 📢

Sistem untuk merekam prospek (CRM) dan mengirimkan pesan pemasaran massal (Broadcast).

### Ekstraksi CRM Otomatis:
- N8N memerintahkan AI untuk selalu mendeteksi kapan pelanggan menyebut nama atau kebutuhannya.
- AI diwajibkan mengeluarkan JSON: `{"extracted_name": "Rina", "extracted_requirement": "Butuh website"}`.
- N8N menembakkan data ini ke `/api/crm/extract` di Vlow Backend, yang kemudian menyimpannya ke tabel `CustomerProfiles`.

### Mekanisme Broadcast:
- Vlow Backend memiliki *route* `/api/broadcast/send`.
- Sistem menarik ribuan nomor dari `CustomerProfiles` yang cocok dengan filter *agent*.
- Menggunakan pendekatan *throttling* asinkron untuk mencegah pemblokiran dari WhatsApp (API Rate Limit).
- Memanfaatkan **WAHA Broadcast Endpoint** atau **Meta Cloud Template Messages** untuk menyebarkan pesan.
