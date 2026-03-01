import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Remove HTTP nodes
data.nodes = data.nodes.filter(n => !n.name.startsWith('Download Welcome Image') && !n.name.startsWith('Download Escalate'));

// 2. Restore WAHA node connections
for (const sourceNode in data.connections) {
    for (const outputType in data.connections[sourceNode]) {
        const connections = data.connections[sourceNode][outputType];
        for (let i = 0; i < connections.length; i++) {
            for(let j = 0; j < connections[i].length; j++) {
                if (connections[i][j].node.startsWith('Download Welcome Image')) {
                    connections[i][j].node = 'Send welcome image1';
                }
                if (connections[i][j].node.startsWith('Download Escalate Image')) {
                    connections[i][j].node = 'WAHA Send Image';
                }
                if (connections[i][j].node.startsWith('Download Escalate File')) {
                    connections[i][j].node = 'WAHA Send File';
                }
            }
        }
    }
}

// 3. Restore WAHA nodes payload
data.nodes.forEach(n => {
    if (n.name === 'Send welcome image1' || n.name === 'WAHA Send Image') {
        n.parameters.file = {
            "mimetype": "image/jpeg",
            "url": "={{ $json.waha_image_url }}"
        };
    }
    if (n.name === 'WAHA Send File') {
        n.parameters.file = {
            "mimetype": "application/pdf",
            "filename": "KnowledgeResource.pdf",
            "url": "={{ $json.waha_image_url }}"
        };
    }
});

// 4. Update JavaScript to use host IP 172.17.0.1:9005 which bypasses HTTPS and goes straight to MinIO
const jsCodeNodes = data.nodes.filter(n => n.type === 'n8n-nodes-base.code' && n.parameters.jsCode && n.parameters.jsCode.includes('waha_image_url'));

jsCodeNodes.forEach(n => {
    n.parameters.jsCode = n.parameters.jsCode.replace(/waha_image_url: welcomeImageUrl(,| )/g, "waha_image_url: welcomeImageUrl && welcomeImageUrl.includes('minio.dayamedialangit.co.id') ? welcomeImageUrl.replace('https://minio.dayamedialangit.co.id', 'http://172.17.0.1:9005') : welcomeImageUrl,");
    n.parameters.jsCode = n.parameters.jsCode.replace(/waha_image_url: imageUrl(,| )/g, "waha_image_url: imageUrl && imageUrl.includes('minio.dayamedialangit.co.id') ? imageUrl.replace('https://minio.dayamedialangit.co.id', 'http://172.17.0.1:9005') : imageUrl ");
});

fs.writeFileSync('n8n-workflow-handover_final.json', JSON.stringify(data, null, 2));
console.log("Reverted to URL IP rewrite successfully.");
