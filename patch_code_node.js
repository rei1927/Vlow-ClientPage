import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// For each Download node → WAHA node pair, insert a Code node in between
// that reads the binary data and converts it to a JSON field (base64Data)

const codeNodeJsCode = `const item = items[0];
const base64 = item.binary.data.data;
return [{
  json: {
    ...item.json,
    base64Data: base64,
    mimeType: item.binary?.data?.mimeType || 'image/jpeg'
  }
}];`;

const pairs = [
    { download: 'Download Image 1', waha: 'Send welcome image1', codeName: 'Extract Base64 1' },
    { download: 'Download Image Booking', waha: 'Send welcome image (booking)', codeName: 'Extract Base64 Booking' },
    { download: 'Download Image Escalate', waha: 'WAHA Send Image', codeName: 'Extract Base64 Escalate' },
    { download: 'Download File Escalate', waha: 'WAHA Send File', codeName: 'Extract Base64 File' },
];

let idCounter = 0;

pairs.forEach(({ download, waha, codeName }) => {
    const downloadNode = data.nodes.find(n => n.name === download);
    const wahaNode = data.nodes.find(n => n.name === waha);
    if (!downloadNode || !wahaNode) {
        console.log(`Skipping pair ${download} -> ${waha}: node not found`);
        return;
    }

    // Create Code node positioned between download and waha
    const codeNode = {
        parameters: {
            jsCode: codeNodeJsCode,
            mode: "runOnceForAllItems"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [
            Math.round((downloadNode.position[0] + wahaNode.position[0]) / 2),
            downloadNode.position[1]
        ],
        id: `extract-b64-${Date.now()}-${idCounter++}`,
        name: codeName
    };
    data.nodes.push(codeNode);

    // Update connections: Download → Code (instead of Download → WAHA)
    if (data.connections[download]) {
        data.connections[download].main[0] = data.connections[download].main[0].map(conn => {
            if (conn.node === waha) {
                return { ...conn, node: codeName };
            }
            return conn;
        });
    }

    // Add connection: Code → WAHA
    data.connections[codeName] = {
        main: [[{ node: waha, type: "main", index: 0 }]]
    };

    // Update WAHA node to use $json.base64Data instead of $binary.data.data
    const isFile = waha === 'WAHA Send File';
    if (isFile) {
        wahaNode.parameters.file = `={\n  "mimetype": "application/pdf",\n  "filename": "document.pdf",\n  "data": "{{$json.base64Data}}"\n}`;
    } else {
        wahaNode.parameters.file = `={\n  "mimetype": "image/jpeg",\n  "filename": "image.jpg",\n  "data": "{{$json.base64Data}}"\n}`;
    }

    console.log(`✅ ${download} → ${codeName} → ${waha}`);
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("\nDone! Pipeline: Download → Extract Base64 → WAHA Send (using $json.base64Data)");
