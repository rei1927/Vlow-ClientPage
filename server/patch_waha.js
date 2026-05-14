const fs = require('fs');
const { execSync } = require('child_process');

console.log("🚀 Memulai proses patching WAHA Plus...");

// 1. Dapatkan nama container WAHA
let wahaContainer = "";
try {
    const psOutput = execSync("docker ps --format '{{.Names}}' | grep waha").toString().trim();
    if (psOutput) {
        wahaContainer = psOutput.split('\n')[0]; // Ambil yang pertama jika ada banyak
        console.log(`✅ Container WAHA ditemukan: ${wahaContainer}`);
    } else {
        console.error("❌ Container WAHA tidak ditemukan! Pastikan WAHA sedang berjalan.");
        process.exit(1);
    }
} catch (e) {
    console.error("❌ Gagal mencari container WAHA:", e.message);
    process.exit(1);
}

// 2. Extract file WebjsClientCore.js
const filePath = "/tmp/WebjsClientCore_Patch.js";
try {
    console.log(`📥 Mengekstrak WebjsClientCore.js dari ${wahaContainer}...`);
    execSync(`docker cp ${wahaContainer}:/app/dist/core/engines/webjs/WebjsClientCore.js ${filePath}`);
    console.log("✅ File berhasil diekstrak ke /tmp");
} catch (e) {
    console.error("❌ Gagal mengekstrak file:", e.message);
    process.exit(1);
}

// 3. Baca dan Patch File
let code = fs.readFileSync(filePath, 'utf8');

// Cari tahu nama variabel import untuk Message (bisa structures_1.Message, dll)
const messageMatch = code.match(/new\s+([a-zA-Z0-9_]+\.Message|Message)\s*\(\s*this\s*,\s*m\s*\)/);
const messageClass = messageMatch ? messageMatch[1] : 'structures_1.Message';

// Definisikan fungsi getMessages yang baru (versi 2026.4.3)
const newGetMessages = `
    async getMessages(chatId, filter, pagination) {
        const messages = await this.pupPage.evaluate(async (chatId, filter, pagination) => {
            pagination.limit ||= Infinity;
            pagination.offset ||= 0;
            const msgFilter = (m) => {
                if (m.isNotification) return false;
                if (filter['filter.fromMe'] != null && m.id.fromMe !== filter['filter.fromMe']) return false;
                if (filter['filter.timestamp.gte'] != null && m.t < filter['filter.timestamp.gte']) return false;
                if (filter['filter.timestamp.lte'] != null && m.t > filter['filter.timestamp.lte']) return false;
                if (filter['filter.ack'] != null && m.ack !== filter['filter.ack']) return false;
                return true;
            };
            
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            if (!chat) return [];
            
            let msgs = [];
            const WAWebDBMessageFindLocal = window.require('WAWebDBMessageFindLocal');
            
            if (WAWebDBMessageFindLocal && WAWebDBMessageFindLocal.msgFindByDirection) {
                const BATCH_SIZE = 20;
                const lastReceivedSerialized = chat.lastReceivedKey?._serialized;
                if (!lastReceivedSerialized) return [];
                
                let currentAnchorKey = window.Store.MsgKey.fromString(lastReceivedSerialized);
                const anchorMsg = window.Store.Msg.get(lastReceivedSerialized);
                if (anchorMsg) msgs.push(anchorMsg);
                
                const neededFiltered = Number.isFinite(pagination.limit + pagination.offset) ? pagination.limit + pagination.offset : Infinity;
                
                const toModel = (m) => {
                    if (m && typeof m.serialize === 'function') return m;
                    const serializedId = m?.id?._serialized;
                    if (serializedId) {
                        const stored = window.Store.Msg.get(serializedId);
                        if (stored) return stored;
                    }
                    return new window.Store.Msg.modelClass(m);
                };
                
                while (true) {
                    const result = await WAWebDBMessageFindLocal.msgFindByDirection({
                        anchor: currentAnchorKey,
                        count: BATCH_SIZE,
                        direction: 'before',
                    });
                    const batch = Array.isArray(result) ? result : result?.messages || [];
                    if (!batch || batch.length === 0) break;
                    
                    const batchModels = batch.map(toModel);
                    msgs = [...batchModels, ...msgs];
                    
                    const seenIds = new Set();
                    msgs = msgs.filter((m) => {
                        const sid = m?.id?._serialized;
                        if (!sid || seenIds.has(sid)) return false;
                        seenIds.add(sid);
                        return true;
                    });
                    
                    if (msgs.filter(msgFilter).length >= neededFiltered) break;
                    if (filter['filter.timestamp.gte'] != null) {
                        const batchMinT = batchModels.reduce((min, m) => Math.min(min, m.t ?? Infinity), Infinity);
                        if (batchMinT < filter['filter.timestamp.gte']) break;
                    }
                    if (batch.length < BATCH_SIZE) break;
                    
                    const oldestInBatch = batchModels[batchModels.length - 1];
                    const oldestSerialized = oldestInBatch?.id?._serialized;
                    if (!oldestSerialized) break;
                    currentAnchorKey = window.Store.MsgKey.fromString(oldestSerialized);
                }
            } else {
                msgs = chat.msgs.getModelsArray();
                while (msgs.length < pagination.limit + pagination.offset) {
                    const loadedMessages = await window.Store.ConversationMsgs.loadEarlierMsgs(chat, chat.msgs);
                    if (!loadedMessages || loadedMessages.length == 0) break;
                    msgs = [...loadedMessages, ...msgs];
                    msgs = msgs.sort((a, b) => b.t - a.t);
                    const earliest = msgs[msgs.length - 1];
                    if (earliest.t < (filter['filter.timestamp.gte'] || Infinity)) break;
                }
            }
            
            msgs = msgs.filter(msgFilter);
            msgs = msgs.sort((a, b) => b.t - a.t);
            
            const offset = Math.max(0, pagination.offset);
            const limit = pagination.limit;
            if (Number.isFinite(limit)) {
                msgs = msgs.slice(offset, offset + limit);
            } else if (offset > 0) {
                msgs = msgs.slice(offset);
            }
            
            return msgs.map((m) => window.WWebJS.getMessageModel(m));
        }, chatId, filter, pagination);
        return messages.map((m) => new ${messageClass}(this, m));
    }
`;

// Cari deklarasi fungsi lama menggunakan Regex
const oldFuncRegex = /async\s+getMessages\s*\(\s*chatId\s*,\s*filter\s*,\s*pagination\s*\)\s*\{[\s\S]*?return\s+messages\.map\s*\(\s*\(\s*m\s*\)\s*=>\s*new\s+(?:[a-zA-Z0-9_]+\.)?Message\s*\(\s*this\s*,\s*m\s*\)\s*\)\s*;\s*\}/;

if (!oldFuncRegex.test(code)) {
    console.error("❌ Gagal menemukan fungsi getMessages lama di dalam file. Patching dibatalkan agar aman.");
    process.exit(1);
}

// Replace kodenya
code = code.replace(oldFuncRegex, newGetMessages.trim());

// Simpan kembali
fs.writeFileSync(filePath, code);
console.log("✅ File berhasil di-patch dengan fungsi terbaru!");

// 4. Masukkan kembali ke container dan restart
try {
    console.log(`📤 Mengirim file kembali ke ${wahaContainer}...`);
    execSync(`docker cp ${filePath} ${wahaContainer}:/app/dist/core/engines/webjs/WebjsClientCore.js`);
    console.log(`🔄 Merestart container ${wahaContainer}... (Ini mungkin memakan waktu beberapa detik)`);
    execSync(`docker restart ${wahaContainer}`);
    console.log("🎉 BERHASIL! WAHA Plus Anda sudah kebal terhadap bug Meta ID.");
} catch (e) {
    console.error("❌ Gagal mengunggah file kembali:", e.message);
    process.exit(1);
}
