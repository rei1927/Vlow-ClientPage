# 💾 Skema Database (PostgreSQL)

Vlow.ai menggunakan **PostgreSQL** sebagai database utama, dikonfigurasi melalui ORM **Sequelize**. Dokumen ini menjelaskan tabel-tabel penting dan konfigurasi tipe data yang krusial.

## 🗄️ Relasi Tabel Utama

- **Users:** Tabel akun utama (Admin/Pemilik Bisnis). Memiliki banyak `Agents`.
- **Agents:** Entitas AI. Mengandung seluruh identitas, *System Instruction*, dan aturan logika AI (seperti RAG, Handover, dan Smart Lead). Satu *Agent* dapat dikoneksikan ke berbagai *platform*.
- **ConnectedPlatforms:** Entitas jembatan. Menyimpan ID sesi spesifik dari platform (WAHA/Meta Cloud). Berelasi `BelongsTo` ke `Agent`.
- **ConversationLogs:** Tabel sejarah obrolan antara Klien dan AI/Manusia. Berelasi ke `Agent` dan `ConnectedPlatform`.
- **ChatHandovers:** Tabel pencatat sesi *Live Chat* ketika admin manusia mengambil alih (*Take Over*).
- **CustomerProfiles:** Basis data CRM. Menyimpan nomor WA/ID, nama hasil ekstraksi, dan kebutuhan (*requirement*) klien. Digunakan sebagai sumber tujuan *Broadcast*.

## 🔑 Penjelasan Kolom Kritis pada Tabel `Agents`

Tabel `Agents` memiliki kolom bertipe `JSONB` yang memberikan fleksibilitas tinggi. Tipe `JSONB` di PostgreSQL memungkinkan penyimpanan struktur JSON yang bersarang tanpa harus membuat banyak kolom baru.

### 1. `leadQualificationConfig` (JSONB)
Menyimpan konfigurasi status pemanasan prospek.
```json
{
  "enabled": true,
  "coldLabelId": "lbl_12345",
  "warmLabelId": "lbl_67890",
  "hotLabelId": "lbl_abcde"
}
```
*Catatan:* ID label ditarik secara dinamis dari API WAHA atau Meta Cloud.

### 2. `handoverConfig` (JSONB)
Menyimpan aturan pengambilalihan *chat* otomatis.
```json
{
  "enabled": true,
  "keywords": ["pesan admin", "mau ngobrol sama manusia"],
  "responseMessage": "Baik, mohon tunggu sebentar. Tim kami akan segera membalas.",
  "autoReleaseMinutes": 30,
  "handoverLabelId": "lbl_handover",
  "aiLabelId": "lbl_ai",
  "escalationPrompt": "Jika ditanya harga diluar list, escalate."
}
```

### 3. `followupConfig` (JSONB)
Menyimpan konfigurasi pengingat otomatis bagi prospek yang menghilang atau tidak merespons (diatur melalui *cron-job* `server/check_cron_debug.js` atau sejenisnya).
```json
{
  "isEnabled": true,
  "delay": 15,
  "unit": "minutes",
  "prompt": "Halo kak, apakah ada yang bisa saya bantu lagi?"
}
```

## 🔄 Cara Melakukan Perubahan Skema (Migrasi)
Jika Anda perlu menambahkan kolom baru, Anda harus:
1. Membuka *file* Model yang relevan (misal `server/models/Agent.js`).
2. Menambahkan definisi kolom di file tersebut.
3. Menjalankan *query* SQL `ALTER TABLE` secara manual di *database* (atau menggunakan *tool migration* Sequelize seperti Umzug, atau `sequelize.sync({ alter: true })` di lingkungan non-produksi) agar tabel ter- *update* tanpa kehilangan data.
*(Contoh nyata: penambahan kolom `leadQualificationConfig` sebelumnya dilakukan melalui eksekusi script raw SQL).*
