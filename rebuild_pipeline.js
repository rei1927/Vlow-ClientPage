import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Strategy: Replace each "Fetch & Encode" Code node with:
//   1. HTTP Request node (downloads file as binary - native N8N, no sandbox)
//   2. Simple Code node (reads binary using $input - N8N built-in, no require/fetch)

// Simple Code that reads binary data - uses ONLY N8N built-in helpers
const extractBase64Code = `// Extract base64 from binary data (N8N built-ins only)
const binary = $input.first().binary;
if (binary && binary.data) {
  return [{ json: { base64Data: binary.data.data } }];
}
return [{ json: { error: 'No binary data received' } }];`;

// Pairs: old code node → new HTTP + Code nodes
const replacements = [
    {
        oldName: 'Fetch & Encode Image',
        httpName: 'Download Image',
        codeName: 'To Base64',
        wahaName: 'Send welcome image1',
        urlExpr: "={{ $('Code in JavaScript').item.json.waha_image_url }}"
    },
    {
        oldName: 'Fetch & Encode Booking',
        httpName: 'Download Image (Booking)',
        codeName: 'To Base64 (Booking)',
        wahaName: 'Send welcome image (booking)',
        urlExpr: "={{ $('Code in JavaScript').item.json.waha_image_url }}"
    },
    {
        oldName: 'Fetch & Encode Escalate Img',
        httpName: 'Download Image (Escalate)',
        codeName: 'To Base64 (Escalate)',
        wahaName: 'WAHA Send Image',
        urlExpr: "={{ $('Code in JavaScript').item.json.waha_image_url }}"
    },
    {
        oldName: 'Fetch & Encode Escalate PDF',
        httpName: 'Download File (Escalate)',
        codeName: 'To Base64 (File)',
        wahaName: 'WAHA Send File',
        urlExpr: "={{ $('Code in JavaScript').item.json.waha_image_url }}"
    },
];

let idCounter = 0;

replacements.forEach(({ oldName, httpName, codeName, wahaName, urlExpr }) => {
    const oldNode = data.nodes.find(n => n.name === oldName);
    const wahaNode = data.nodes.find(n => n.name === wahaName);
    if (!oldNode) {
        console.log(`${oldName} not found, skipping.`);
        return;
    }

    const basePos = oldNode.position;

    // Create HTTP Request node (downloads file as binary)
    const httpNode = {
        parameters: {
            url: urlExpr,
            options: {
                response: {
                    response: {
                        responseFormat: "file"
                    }
                }
            }
        },
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [basePos[0], basePos[1]],
        id: `http-dl-${Date.now()}-${idCounter++}`,
        name: httpName
    };

    // Create simple Code node (reads binary using N8N builtins)
    const codeNode = {
        parameters: {
            jsCode: extractBase64Code,
            mode: "runOnceForAllItems"
        },
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [basePos[0] + 200, basePos[1]],
        id: `extract-b64-${Date.now()}-${idCounter++}`,
        name: codeName
    };

    // Remove old node
    data.nodes = data.nodes.filter(n => n.name !== oldName);

    // Add new nodes
    data.nodes.push(httpNode);
    data.nodes.push(codeNode);

    // Fix connections: anything → oldNode becomes anything → httpNode
    for (const srcNode in data.connections) {
        if (data.connections[srcNode].main) {
            data.connections[srcNode].main.forEach((outputConns, idx) => {
                outputConns.forEach((conn, connIdx) => {
                    if (conn.node === oldName) {
                        data.connections[srcNode].main[idx][connIdx] = { ...conn, node: httpName };
                    }
                });
            });
        }
    }

    // Remove old connection entry
    delete data.connections[oldName];

    // Add connections: HTTP → Code → WAHA
    data.connections[httpName] = {
        main: [[{ node: codeName, type: "main", index: 0 }]]
    };
    data.connections[codeName] = {
        main: [[{ node: wahaName, type: "main", index: 0 }]]
    };

    // Ensure WAHA node uses $json.base64Data
    if (wahaNode) {
        const isFile = wahaName === 'WAHA Send File';
        const mime = isFile ? 'application/pdf' : 'image/jpeg';
        const fname = isFile ? 'document.pdf' : 'image.jpg';
        wahaNode.parameters.file = `={\n  "mimetype": "${mime}",\n  "filename": "${fname}",\n  "data": "{{$json.base64Data}}"\n}`;
    }

    console.log(`✅ ${httpName} → ${codeName} → ${wahaName}`);
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("\nDone! Pipeline: HTTP Request (download) → Code (extract base64) → WAHA Send");
