import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// We need to find all WAHA nodes that send an image or file, and insert an HTTP Request node before them.
// Looking at the JSON, we have:
// 1. "Send welcome image1"
// 2. "WAHA Send Image"
// 3. "WAHA Send File"

const httpNodes = [];

function createHttpNode(id, name, urlParam, yPos) {
    return {
      "parameters": {
        "url": urlParam,
        "responseFormat": "file",
        "options": {
            "allowUnauthorizedCerts": true
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        57100, // adjust later
        yPos
      ],
      "id": id,
      "name": name
    }
}

// 1. Send welcome image1
const sendWelcomeImageNode = data.nodes.find(n => n.name === 'Send welcome image1');
if (sendWelcomeImageNode) {
    const httpNodeName = "Download Welcome Image";
    const httpNodeId = "http-download-welcome";
    
    // Instead of using URL in WAHA, we use the downloaded file
    sendWelcomeImageNode.parameters.file = "={\n  \"mimetype\": \"image/jpeg\",\n  \"filename\": \"image.jpg\",\n  \"data\": \"{{$binary.data.data}}\"\n}";
    
    // Position HTTP node before WAHA
    const httpNode = createHttpNode(
        httpNodeId, 
        httpNodeName, 
        "={{ $('Code in JavaScript').item.json.waha_image_url }}",
        sendWelcomeImageNode.position[1]
    );
    httpNode.position[0] = sendWelcomeImageNode.position[0] - 200;
    
    data.nodes.push(httpNode);
    
    // Update connections
    // Find who connects to "Send welcome image1"
    for (const sourceNode in data.connections) {
        for (const outputType in data.connections[sourceNode]) {
            const connections = data.connections[sourceNode][outputType];
            for (let i = 0; i < connections.length; i++) {
                for(let j = 0; j < connections[i].length; j++) {
                    if (connections[i][j].node === 'Send welcome image1') {
                        // Reroute to HTTP node
                        connections[i][j].node = httpNodeName;
                    }
                }
            }
        }
    }
    
    // Connect HTTP node to WAHA node
    data.connections[httpNodeName] = {
        "main": [
            [
                {
                    "node": "Send welcome image1",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    };
}

// 2. WAHA Send Image
const wahaSendImageNode = data.nodes.find(n => n.name === 'WAHA Send Image');
if (wahaSendImageNode) {
    const httpNodeName = "Download Escalate Image";
    const httpNodeId = "http-download-escalate-image";
    
    wahaSendImageNode.parameters.file = {
        "mimetype": "image/jpeg",
        "filename": "image.jpg",
        "data": "={{ $binary.data.data }}"
    };
    
    const httpNode = createHttpNode(
        httpNodeId, 
        httpNodeName, 
        "={{ $json.waha_image_url }}",
        wahaSendImageNode.position[1]
    );
    httpNode.position[0] = wahaSendImageNode.position[0] - 200;
    
    data.nodes.push(httpNode);
    
    for (const sourceNode in data.connections) {
        for (const outputType in data.connections[sourceNode]) {
            const connections = data.connections[sourceNode][outputType];
            for (let i = 0; i < connections.length; i++) {
                for(let j = 0; j < connections[i].length; j++) {
                    if (connections[i][j].node === 'WAHA Send Image') {
                        connections[i][j].node = httpNodeName;
                    }
                }
            }
        }
    }
    
    data.connections[httpNodeName] = {
        "main": [
            [
                {
                    "node": "WAHA Send Image",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    };
}

// 3. WAHA Send File
const wahaSendFileNode = data.nodes.find(n => n.name === 'WAHA Send File');
if (wahaSendFileNode) {
    const httpNodeName = "Download Escalate File";
    const httpNodeId = "http-download-escalate-file";
    
    wahaSendFileNode.parameters.file = {
        "mimetype": "application/pdf",
        "filename": "document.pdf",
        "data": "={{ $binary.data.data }}"
    };
    
    const httpNode = createHttpNode(
        httpNodeId, 
        httpNodeName, 
        "={{ $json.waha_image_url }}",
        wahaSendFileNode.position[1]
    );
    httpNode.position[0] = wahaSendFileNode.position[0] - 200;
    
    data.nodes.push(httpNode);
    
    for (const sourceNode in data.connections) {
        for (const outputType in data.connections[sourceNode]) {
            const connections = data.connections[sourceNode][outputType];
            for (let i = 0; i < connections.length; i++) {
                for(let j = 0; j < connections[i].length; j++) {
                    if (connections[i][j].node === 'WAHA Send File') {
                        connections[i][j].node = httpNodeName;
                    }
                }
            }
        }
    }
    
    data.connections[httpNodeName] = {
        "main": [
            [
                {
                    "node": "WAHA Send File",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    };
}

fs.writeFileSync('n8n-workflow-handover.json', JSON.stringify(data, null, 2));
console.log("Patched N8N to use HTTP Download -> Binary Data successfully.");
