import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// STEP 1: Remove ALL URL rewriting logic from JavaScript code nodes.
// Just set waha_image_url = welcomeImageUrl (the original public URL).
// N8N's HTTP Request node is a standard Node.js HTTP client, NOT a browser.
// It can download from public URLs without any Chromium restrictions.

data.nodes.forEach(n => {
    if (n.type === 'n8n-nodes-base.code' && n.parameters.jsCode) {
        // Replace complex rewrite logic with simple passthrough
        n.parameters.jsCode = n.parameters.jsCode.replace(
            /waha_image_url: welcomeImageUrl && welcomeImageUrl\.includes\([^)]+\) \? welcomeImageUrl\.replace\([^)]+\) : welcomeImageUrl,/g,
            "waha_image_url: welcomeImageUrl,"
        );
        n.parameters.jsCode = n.parameters.jsCode.replace(
            /waha_image_url: imageUrl && imageUrl\.includes\([^)]+\) \? imageUrl\.replace\([^)]+\) : imageUrl/g,
            "waha_image_url: imageUrl"
        );
    }
});

// STEP 2: Update the HTTP Download nodes to use the public URL directly
// (they currently reference waha_image_url which now equals the public MinIO URL)
// No changes needed here since they reference the field by name.

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("Cleaned up: waha_image_url now passes the original public MinIO URL directly.");

// Verify
const verify = JSON.parse(fs.readFileSync(file, 'utf8'));
verify.nodes.forEach(n => {
    if (n.type === 'n8n-nodes-base.code' && n.parameters.jsCode && n.parameters.jsCode.includes('waha_image_url')) {
        const match = n.parameters.jsCode.match(/waha_image_url:[^\n]*/g);
        if (match) {
            match.forEach(m => console.log(`  ${n.name}: ${m.trim()}`));
        }
    }
});
