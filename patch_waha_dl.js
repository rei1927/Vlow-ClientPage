const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'n8n-workflow-combined.json');
let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let updated = 0;
content.nodes.forEach(n => {
    // WAHA default is "Download Image" and "Download Image (Escalate)"
    if (n.name && n.name.includes("Download Image") && n.type === "n8n-nodes-base.httpRequest") {
        if (n.parameters && n.parameters.url) {
            // Check if it already has the rewrite
            if (!n.parameters.url.includes("172.17.0.6")) {
                let original = n.parameters.url;
                n.parameters.url = original.replace('waha_image_url }}', "waha_image_url ? $('Code in JavaScript').item.json.waha_image_url.replace('https://minio.dayamedialangit.co.id', 'http://172.17.0.6:9000') : '' }}");
                console.log(`Updated node: ${n.name}`);
                updated++;
            }
        }
    }
});

if (updated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Successfully patched ${updated} WAHA Download Image nodes.`);
} else {
    console.log("No nodes needed patching or none were found.");
}
