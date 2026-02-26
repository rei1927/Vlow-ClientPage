const fs = require('fs');
const path = 'n8n-workflow-handover.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Modify "Code in JavaScript" node ID to output image URL explicitly
const codeNode = data.nodes.find(n => n.name === 'Code in JavaScript');
if (codeNode) {
    // Code in JavaScript already parses welcome_image_url and puts it in json.welcome_image_url
    // No changes needed to the code block there.
}

// 2. We need an IF node after "Code in JavaScript" to check for image
// Let's create an IF node
const ifNodeId = 'if-has-image-' + Date.now();
const ifNode = {
    "parameters": {
        "conditions": {
            "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
            },
            "conditions": [
                {
                    "id": "e7c2e9b0-4f51-4f1b-85d8-c89b7888b64e",
                    "leftValue": "={{ $json.welcome_image_url }}",
                    "operator": {
                        "type": "string",
                        "operation": "isNotEmpty"
                    }
                }
            ],
            "combinator": "and"
        },
        "options": {}
    },
    "type": "n8n-nodes-base.if",
    "typeVersion": 2.2,
    "position": [
        55960,
        10256
    ],
    "id": ifNodeId,
    "name": "Check If Image Exists"
};

// 3. Create WAHA Send Image Node
const sendImageNodeId = 'waha-send-image-' + Date.now();
const sendImageNode = {
    "parameters": {
        "resource": "Chatting",
        "operation": "Send Image",
        "session": "={{ $('WAHA Trigger').item.json.session }}",
        "chatId": "={{ $('WAHA Trigger').item.json.payload.from }}",
        "file": {
            "mimetype": "image/jpeg",
            "url": "={{ $json.welcome_image_url }}"
        },
        "caption": "={{ $json.text_for_wa }}",
        "requestOptions": {}
    },
    "type": "@devlikeapro/n8n-nodes-waha.WAHA",
    "typeVersion": 202502,
    "position": [
        56160,
        10156
    ],
    "id": sendImageNodeId,
    "name": "WAHA Send Image",
    "credentials": {
        "wahaApi": {
            "id": "EAjwwejArle7S4Fw",
            "name": "WAHA account"
        }
    }
};

// 4. Create WAHA Send File Node (fallback for PDF)
const sendFileNodeId = 'waha-send-file-' + Date.now();
const sendFileNode = {
    "parameters": {
        "resource": "Chatting",
        "operation": "Send File",
        "session": "={{ $('WAHA Trigger').item.json.session }}",
        "chatId": "={{ $('WAHA Trigger').item.json.payload.from }}",
        "file": {
            "mimetype": "application/pdf",
            "filename": "KnowledgeResource.pdf",
            "url": "={{ $json.welcome_image_url }}"
        },
        "caption": "={{ $json.text_for_wa }}",
        "requestOptions": {}
    },
    "type": "@devlikeapro/n8n-nodes-waha.WAHA",
    "typeVersion": 202502,
    "position": [
        56160,
        10356
    ],
    "id": sendFileNodeId,
    "name": "WAHA Send File",
    "credentials": {
        "wahaApi": {
            "id": "EAjwwejArle7S4Fw",
            "name": "WAHA account"
        }
    }
};

// IF IS PDF Node
const ifIsPdfNodeId = 'if-is-pdf-' + Date.now();
const ifIsPdfNode = {
    "parameters": {
        "conditions": {
            "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
            },
            "conditions": [
                {
                    "id": "e7c2e9b0-4f51-4f1b-85d8-c89b7888b64e",
                    "leftValue": "={{ $json.welcome_image_url }}",
                    "rightValue": ".pdf",
                    "operator": {
                        "type": "string",
                        "operation": "endsWith"
                    }
                }
            ],
            "combinator": "and"
        },
        "options": {
            "ignoreCase": true
        }
    },
    "type": "n8n-nodes-base.if",
    "typeVersion": 2.2,
    "position": [
        56100,
        10256
    ],
    "id": ifIsPdfNodeId,
    "name": "Check If is PDF"
};


// 5. Add nodes to Workflow
data.nodes.push(ifNode);
data.nodes.push(ifIsPdfNode);
data.nodes.push(sendImageNode);
data.nodes.push(sendFileNode);

// 6. Update Connections

// The current connection from "Code in JavaScript" might go to "IF ESCALATE"
let nextNodesFromCode = [];
if (data.connections["Code in JavaScript"]) {
    let oldMain = data.connections["Code in JavaScript"].main[0];
    if (oldMain && oldMain.length > 0) {
        // Save the old target (e.g. IF ESCALATE)
        nextNodesFromCode = [...oldMain];
    }
} else {
    data.connections["Code in JavaScript"] = { main: [[]] };
}

// Redirect "Code in JavaScript" to "Check If Image Exists"
data.connections["Code in JavaScript"].main[0] = [
    { node: "Check If Image Exists", type: "main", index: 0 }
];

// Re-link "Check If Image Exists"
data.connections["Check If Image Exists"] = {
    main: [
        [ // True Branch: Has Image
            { node: "Check If is PDF", type: "main", index: 0 }
        ],
        [ // False branch: No Image, continue to Original Path
            ...nextNodesFromCode
        ]
    ]
};

data.connections["Check If is PDF"] = {
    main: [
        [ // True Branch: Is PDF -> Send File
            { node: "WAHA Send File", type: "main", index: 0 }

        ],
        [ // False branch: Not PDF -> Send Image
            { node: "WAHA Send Image", type: "main", index: 0 }
        ]
    ]
};


// Link "WAHA Send Image" and "WAHA Send File" back to original path (IF ESCALATE)
// But WAHA Send Image / File already sends the text! Wait, we used 'caption' parameter.
// But the original path might have another "Send Text" node downstream. 
// If we send via WAHA Image with caption, then the text is sent. Sending it AGAIN down the original path would duplicate it.
// EXCEPT the original path might check escalating logic. 
// Let's modify the WAHA nodes. Let's REMOVE text from caption, and send JUST the image, then let it flow down to Send Text.

sendImageNode.parameters.caption = "";
sendFileNode.parameters.caption = "";

data.connections["WAHA Send Image"] = {
    main: [
        [...nextNodesFromCode] // Proceed to IF ESCALATE
    ]
};

data.connections["WAHA Send File"] = {
    main: [
        [...nextNodesFromCode] // Proceed to IF ESCALATE
    ]
};


// Write file
fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log("Updated N8N Workflow successfully");
