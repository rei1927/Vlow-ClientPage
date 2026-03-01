import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Remove ALL Download HTTP nodes and Extract Base64 code nodes
const removeNames = [
    'Download Image 1', 'Download Image Booking', 'Download Image Escalate', 'Download File Escalate',
    'Extract Base64 1', 'Extract Base64 Booking', 'Extract Base64 Escalate', 'Extract Base64 File'
];
data.nodes = data.nodes.filter(n => !removeNames.includes(n.name));

// Also remove their connections
removeNames.forEach(name => { delete data.connections[name]; });

// The JS code for the all-in-one fetch+encode node
const fetchCodeImage = `// Fetch image from MinIO and convert to base64
const imageUrl = items[0].json.waha_image_url;
if (!imageUrl) return items;

const resp = await fetch(imageUrl, { redirect: 'follow' });
if (!resp.ok) throw new Error('Download failed: ' + resp.status);

const buf = Buffer.from(await resp.arrayBuffer());
const base64 = buf.toString('base64');

return [{
  json: {
    ...items[0].json,
    base64Data: base64
  }
}];`;

const fetchCodeFile = `// Fetch PDF from MinIO and convert to base64
const fileUrl = items[0].json.waha_image_url;
if (!fileUrl) return items;

const resp = await fetch(fileUrl, { redirect: 'follow' });
if (!resp.ok) throw new Error('Download failed: ' + resp.status);

const buf = Buffer.from(await resp.arrayBuffer());
const base64 = buf.toString('base64');

return [{
  json: {
    ...items[0].json,
    base64Data: base64
  }
}];`;

// Create replacement "Fetch & Encode" nodes
const replacements = [
    {
        name: 'Fetch & Encode Image',
        wahaNode: 'Send welcome image1',
        sourceConnNode: 'HAS WELCOME IMAGE',
        sourceOutputIdx: 0,
        code: fetchCodeImage
    },
    {
        name: 'Fetch & Encode Booking',
        wahaNode: 'Send welcome image (booking)',
        sourceConnNode: 'HAS WELCOME IMAGE (BOOKING)',
        sourceOutputIdx: 0,
        code: fetchCodeImage
    },
    {
        name: 'Fetch & Encode Escalate Img',
        wahaNode: 'WAHA Send Image',
        sourceConnNode: 'Check If is PDF',
        sourceOutputIdx: 1,  // False branch (not PDF = image)
        code: fetchCodeImage
    },
    {
        name: 'Fetch & Encode Escalate PDF',
        wahaNode: 'WAHA Send File',
        sourceConnNode: 'Check If is PDF',
        sourceOutputIdx: 0,  // True branch (is PDF)
        code: fetchCodeFile
    },
];

let idCounter = 0;

replacements.forEach(({ name, wahaNode, sourceConnNode, sourceOutputIdx, code }) => {
    const waha = data.nodes.find(n => n.name === wahaNode);
    if (!waha) {
        console.log(`WAHA node ${wahaNode} not found, skipping`);
        return;
    }

    // Create the fetch+encode Code node
    const codeNode = {
        parameters: {
            jsCode: code,
            mode: "runOnceForAllItems"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [waha.position[0] - 200, waha.position[1]],
        id: `fetch-encode-${Date.now()}-${idCounter++}`,
        name: name
    };
    data.nodes.push(codeNode);

    // Fix connections: source → this code node → waha node
    // First, find any connection pointing to the WAHA node and reroute to our code node
    for (const srcNode in data.connections) {
        if (data.connections[srcNode].main) {
            data.connections[srcNode].main.forEach((outputConns, idx) => {
                outputConns.forEach((conn, connIdx) => {
                    if (conn.node === wahaNode) {
                        data.connections[srcNode].main[idx][connIdx] = { ...conn, node: name };
                    }
                });
            });
        }
    }

    // Connect code node → waha node
    data.connections[name] = {
        main: [[{ node: wahaNode, type: "main", index: 0 }]]
    };

    // WAHA node uses $json.base64Data
    const isFile = wahaNode === 'WAHA Send File';
    if (isFile) {
        waha.parameters.file = `={\n  "mimetype": "application/pdf",\n  "filename": "document.pdf",\n  "data": "{{$json.base64Data}}"\n}`;
    } else {
        waha.parameters.file = `={\n  "mimetype": "image/jpeg",\n  "filename": "image.jpg",\n  "data": "{{$json.base64Data}}"\n}`;
    }

    console.log(`✅ ${sourceConnNode} → ${name} → ${wahaNode}`);
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("\nDone! All-in-one fetch+encode Code nodes replace the broken binary pipeline.");
