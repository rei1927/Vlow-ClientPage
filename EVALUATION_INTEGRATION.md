# Panduan Integrasi Evaluation Tab dengan n8n Workflow

## Ringkasan
Tab Evaluation memungkinkan Anda melihat analitik performa AI Agent, termasuk:
- **Total Percakapan**: Jumlah percakapan dalam periode tertentu
- **Sentiment Score**: Persentase sentimen positif dari user
- **Handover Rate**: Persentase percakapan yang dialihkan ke manusia
- **Tren Harian**: Grafik tren percakapan dan handoff selama 7 hari terakhir
- **Percakapan Terakhir**: Daftar 10 percakapan terakhir

## Komponen yang Sudah Dibuat

### 1. Backend
- ✅ Model `ConversationLog` untuk menyimpan data interaksi
- ✅ Endpoint `GET /api/agents/:id/analytics` untuk mengambil data analitik
- ✅ Endpoint `POST /api/analytics/log` (public) untuk logging dari n8n
- ✅ Relasi database antara Agent, ConnectedPlatform, dan ConversationLog

### 2. Frontend
- ✅ Tab Evaluation dengan UI yang modern dan responsive
- ✅ Chart.js untuk visualisasi tren percakapan
- ✅ Filter periode (Hari Ini, 7 Hari, Bulan Ini)
- ✅ KPI cards dengan gradient dan animasi
- ✅ Tabel percakapan terakhir

## Update Workflow n8n

Untuk mengaktifkan logging conversation, Anda perlu menambahkan node **HTTP Request** di workflow n8n setelah node yang mengirim pesan ke user.

### Langkah-langkah:

1. **Buka workflow n8n Anda** (`Chatbot - Mas Reiza.json`)

2. **Cari node "Send a text message8"** (ID: `5de60804-645d-400a-898e-233669e4b53f`)
   - Node ini mengirim pesan text ke user setelah AI merespon

3. **Tambahkan node HTTP Request baru** setelah "Send a text message8":
   - **Nama Node**: `Log Conversation`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `http://172.26.224.1:5000/api/analytics/log` (sesuaikan dengan backend URL Anda)
   - **Body** (JSON):
     ```json
     {
       "agentId": "={{ $('Fetch Config DB').item.json.agentId }}",
       "platformId": "={{ $('Fetch Config DB').item.json.platformId }}",
       "sessionId": "={{ $('WAHA Trigger').item.json.session }}",
       "chatId": "={{ $('WAHA Trigger').item.json.payload.from }}",
       "userMessage": "={{ $('Set Prod Mode').item.json.message }}",
       "aiResponse": "={{ $json.text_for_wa }}",
       "isHandoff": "={{ $json.escalate || false }}",
       "mode": "production"
     }
     ```

4. **Update Connections**:
   - Dari node "Send a text message8" → ke node "Log Conversation"
   - Dari node "Log Conversation" → ke node "FOLLOWUP ENABLED?1"

### Catatan Penting:

- **Mode Production Only**: Logging hanya dilakukan di mode production (bukan simulator)
- **Error Handling**: Node logging tidak boleh menghentikan flow jika gagal. Gunakan opsi "Continue On Fail" di n8n
- **Data Required**: Pastikan node "Fetch Config DB" mengembalikan `agentId` dan `platformId` (sudah diupdate di backend)

### Contoh Node Configuration (JSON):

```json
{
  "parameters": {
    "url": "http://172.26.224.1:5000/api/analytics/log",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"agentId\": \"{{ $('Fetch Config DB').item.json.agentId }}\",\n  \"platformId\": \"{{ $('Fetch Config DB').item.json.platformId }}\",\n  \"sessionId\": \"{{ $('WAHA Trigger').item.json.session }}\",\n  \"chatId\": \"{{ $('WAHA Trigger').item.json.payload.from }}\",\n  \"userMessage\": \"{{ $('Set Prod Mode').item.json.message }}\",\n  \"aiResponse\": \"{{ $json.text_for_wa }}\",\n  \"isHandoff\": \"{{ $json.escalate || false }}\",\n  \"mode\": \"production\"\n}",
    "options": {
      "continueOnFail": true
    }
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.3,
  "position": [5600, 1472],
  "id": "log-conversation-node-id",
  "name": "Log Conversation"
}
```

### Update Connections di Workflow:

Di bagian `connections`, update sebagai berikut:

```json
"Send a text message8": {
  "main": [
    [
      {
        "node": "Log Conversation",
        "type": "main",
        "index": 0
      }
    ]
  ]
},
"Log Conversation": {
  "main": [
    [
      {
        "node": "FOLLOWUP ENABLED?1",
        "type": "main",
        "index": 0
      }
    ]
  ]
}
```

## Testing

### 1. Testing di Production Mode:
1. Pastikan workflow n8n sudah diupdate dengan node logging
2. Kirim pesan ke WhatsApp yang terhubung dengan AI Agent
3. Buka halaman AI Agent → Tab Evaluation
4. Data analitik akan muncul setelah ada interaksi

### 2. Verifikasi Logging:
- Cek database tabel `ConversationLogs` untuk memastikan data tersimpan
- Cek tab Evaluation untuk melihat metrik yang terupdate

### 3. Testing Filter Periode:
- Klik tombol "Hari Ini", "7 Hari", atau "Bulan Ini"
- Pastikan data berubah sesuai periode yang dipilih

## Troubleshooting

### Data tidak muncul di Evaluation Tab:
1. Pastikan node logging sudah ditambahkan di workflow n8n
2. Cek apakah endpoint `/api/analytics/log` bisa diakses dari n8n
3. Cek console backend untuk error logging
4. Pastikan `agentId` dan `platformId` tersedia di node "Fetch Config DB"

### Error di n8n saat logging:
- Pastikan URL backend benar
- Pastikan semua field yang diperlukan tersedia di workflow
- Aktifkan "Continue On Fail" agar workflow tidak terhenti

## Fitur Tambahan (Opsional)

### Sentiment Analysis:
Saat ini sentiment masih `null`. Untuk menambahkan sentiment analysis:
1. Tambahkan node AI/ML di n8n untuk analisis sentiment
2. Update field `sentiment` di payload logging dengan hasil analisis

### Real-time Updates:
Untuk update real-time, bisa menggunakan WebSocket atau polling interval di frontend.
