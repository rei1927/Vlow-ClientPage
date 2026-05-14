#!/bin/bash
set -e

echo "🚀 Memulai proses patching WAHA Plus..."

# 1. Dapatkan nama container WAHA
WAHA_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i waha | head -n 1)

if [ -z "$WAHA_CONTAINER" ]; then
  echo "❌ Container WAHA tidak ditemukan! Pastikan WAHA sedang berjalan."
  exit 1
fi

echo "✅ Container WAHA ditemukan: $WAHA_CONTAINER"

# 2. Extract file WebjsClientCore.js
FILE_PATH="/tmp/WebjsClientCore.js"
echo "📥 Mengekstrak WebjsClientCore.js dari $WAHA_CONTAINER..."
docker cp $WAHA_CONTAINER:/app/dist/core/engines/webjs/WebjsClientCore.js $FILE_PATH
echo "✅ File berhasil diekstrak ke /tmp"

# 3. Jalankan patcher Node.js menggunakan container node sementara
echo "⚙️ Memproses modifikasi file..."
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
docker run --rm -v /tmp:/tmp -v "$DIR/patch_waha.js:/patch.js" node:18-alpine node /patch.js /tmp/WebjsClientCore.js

# 4. Masukkan kembali ke container dan restart
echo "📤 Mengirim file kembali ke $WAHA_CONTAINER..."
docker cp $FILE_PATH $WAHA_CONTAINER:/app/dist/core/engines/webjs/WebjsClientCore.js

echo "🔄 Merestart container $WAHA_CONTAINER... (Ini mungkin memakan waktu beberapa detik)"
docker restart $WAHA_CONTAINER

echo "🎉 BERHASIL! WAHA Plus Anda sudah kebal terhadap bug Meta ID."
