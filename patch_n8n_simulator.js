import fs from 'fs';

const filePath = '/Users/reizarachmattullah/Documents/PROJECT WEB APP VLOW/Ai-agent-client-dashboard-master/n8n-workflow-handover.json';

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Define Respond to Webhook Node
    const respondNode = {
        "parameters": {
            "respondWith": "json",
            "responseBody": "={\n\"output\": \"{{ $json.output }}\",\n\"welcome_image_url\": \"{{ $json.welcome_image_url }}\"\n}",
            "options": {}
        },
        "type": "n8n-nodes-base.respondToWebhook",
        "typeVersion": 1.1,
        "position": [
            56000,
            10500
        ],
        "id": "sim-respond-to-webhook",
        "name": "Respond Webhook Simulator"
    };

    // Add the node if it doesn't already exist
    if (!data.nodes.find(n => n.name === "Respond Webhook Simulator")) {
        data.nodes.push(respondNode);
    }

    // Find Process Sim Response and connect it to Respond to Webhook
    if (!data.connections["Process Sim Response"]) {
        data.connections["Process Sim Response"] = { "main": [[]] };
    }

    // Override connection to point to Respond Webhook
    data.connections["Process Sim Response"].main[0] = [
        {
            "node": "Respond Webhook Simulator",
            "type": "main",
            "index": 0
        }
    ];

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Successfully appended Respond to Webhook Simulator node.");

} catch (err) {
    console.error("Error modifying n8n workflow:", err);
}
