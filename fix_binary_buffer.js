import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// N8N stores large binary data in filesystem storage.
// $input.first().binary.data.data returns a REFERENCE like "filesysv2:..."
// We must use this.helpers.getBinaryDataBuffer() to get actual content.

const extractCode = `// Get actual binary buffer from N8N storage (not the filesystem reference)
const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');
const base64 = buffer.toString('base64');
return [{ json: { base64Data: base64 } }];`;

data.nodes.forEach(n => {
    if (['To Base64', 'To Base64 (Booking)', 'To Base64 (Escalate)', 'To Base64 (File)'].includes(n.name)) {
        n.parameters.jsCode = extractCode;
        console.log(`Fixed: ${n.name}`);
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("Done! Code nodes now use this.helpers.getBinaryDataBuffer()");
