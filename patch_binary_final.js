import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// STEP 1: Change waha_image_url in JavaScript Code nodes to use vlow_minio:9000
data.nodes.forEach(n => {
    if (n.type === 'n8n-nodes-base.code' && n.parameters.jsCode) {
        // Replace any 172.17.0.1:9005 references back to vlow_minio:9000
        n.parameters.jsCode = n.parameters.jsCode.replace(/http:\/\/172\.17\.0\.1:9005/g, 'http://vlow_minio:9000');
        // Also ensure the waha_image_url transform logic uses vlow_minio
        n.parameters.jsCode = n.parameters.jsCode.replace(
            /waha_image_url: welcomeImageUrl && welcomeImageUrl\.includes\('minio\.dayamedialangit\.co\.id'\) \? welcomeImageUrl\.replace\('https:\/\/minio\.dayamedialangit\.co\.id', 'http:\/\/172\.17\.0\.1:9005'\) : welcomeImageUrl,/g,
            "waha_image_url: welcomeImageUrl && welcomeImageUrl.includes('minio.dayamedialangit.co.id') ? welcomeImageUrl.replace('https://minio.dayamedialangit.co.id', 'http://vlow_minio:9000') : welcomeImageUrl,"
        );
        n.parameters.jsCode = n.parameters.jsCode.replace(
            /waha_image_url: imageUrl && imageUrl\.includes\('minio\.dayamedialangit\.co\.id'\) \? imageUrl\.replace\('https:\/\/minio\.dayamedialangit\.co\.id', 'http:\/\/172\.17\.0\.1:9005'\) : imageUrl/g,
            "waha_image_url: imageUrl && imageUrl.includes('minio.dayamedialangit.co.id') ? imageUrl.replace('https://minio.dayamedialangit.co.id', 'http://vlow_minio:9000') : imageUrl"
        );
    }
});

// STEP 2: For each WAHA Send Image/File node, add an HTTP Request download node before it
// and change the WAHA node to use base64 data instead of URL

const wahaImageNodes = [
    { name: 'Send welcome image1', downloadName: 'Download Image 1', urlExpr: "={{$('Code in JavaScript').item.json.waha_image_url}}" },
    { name: 'Send welcome image (booking)', downloadName: 'Download Image Booking', urlExpr: "={{$('Code in JavaScript').item.json.waha_image_url}}" },
    { name: 'WAHA Send Image', downloadName: 'Download Image Escalate', urlExpr: "={{$json.waha_image_url}}" },
];

const wahaFileNodes = [
    { name: 'WAHA Send File', downloadName: 'Download File Escalate', urlExpr: "={{$json.waha_image_url}}" },
];

let posOffset = 0;

wahaImageNodes.forEach(({ name, downloadName, urlExpr }) => {
    const wahaNode = data.nodes.find(n => n.name === name);
    if (!wahaNode) {
        console.log(`Node ${name} not found, skipping.`);
        return;
    }

    // Create HTTP Request download node
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
        position: [wahaNode.position[0] - 250, wahaNode.position[1]],
        id: `http-dl-${Date.now()}-${posOffset++}`,
        name: downloadName
    };
    data.nodes.push(httpNode);

    // Change the WAHA node to use base64 data from binary
    wahaNode.parameters.file = `={\n  "mimetype": "image/jpeg",\n  "filename": "image.jpg",\n  "data": "{{$binary.data.data}}"\n}`;

    // Reroute connections: anything leading to this WAHA node → lead to HTTP node instead
    for (const sourceNode in data.connections) {
        for (const outputType in data.connections[sourceNode]) {
            const connections = data.connections[sourceNode][outputType];
            for (let i = 0; i < connections.length; i++) {
                for (let j = 0; j < connections[i].length; j++) {
                    if (connections[i][j].node === name) {
                        connections[i][j].node = downloadName;
                    }
                }
            }
        }
    }

    // Connect HTTP node → WAHA node
    data.connections[downloadName] = {
        main: [[{ node: name, type: "main", index: 0 }]]
    };

    console.log(`Patched ${name} with download node ${downloadName}`);
});

wahaFileNodes.forEach(({ name, downloadName, urlExpr }) => {
    const wahaNode = data.nodes.find(n => n.name === name);
    if (!wahaNode) {
        console.log(`Node ${name} not found, skipping.`);
        return;
    }

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
        position: [wahaNode.position[0] - 250, wahaNode.position[1]],
        id: `http-dl-${Date.now()}-${posOffset++}`,
        name: downloadName
    };
    data.nodes.push(httpNode);

    wahaNode.parameters.file = `={\n  "mimetype": "application/pdf",\n  "filename": "document.pdf",\n  "data": "{{$binary.data.data}}"\n}`;

    for (const sourceNode in data.connections) {
        for (const outputType in data.connections[sourceNode]) {
            const connections = data.connections[sourceNode][outputType];
            for (let i = 0; i < connections.length; i++) {
                for (let j = 0; j < connections[i].length; j++) {
                    if (connections[i][j].node === name) {
                        connections[i][j].node = downloadName;
                    }
                }
            }
        }
    }

    data.connections[downloadName] = {
        main: [[{ node: name, type: "main", index: 0 }]]
    };

    console.log(`Patched ${name} with download node ${downloadName}`);
});

fs.writeFileSync('n8n-workflow-handover.json', JSON.stringify(data, null, 2));
console.log("\nDone! All WAHA image/file nodes now use N8N HTTP download + base64 data.");
