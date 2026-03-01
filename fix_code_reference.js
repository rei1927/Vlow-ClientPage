import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// The IF node "HAS WELCOME IMAGE" passes only {result: true} to the next node,
// NOT the original data with waha_image_url. We need to reference the source node directly.

const fixedImageCode = `// Fetch image from MinIO and convert to base64
// Reference the original Code in JavaScript node since IF nodes don't pass through data
const imageUrl = $('Code in JavaScript').item.json.waha_image_url;
if (!imageUrl) {
  return [{ json: { error: 'No image URL found' } }];
}

const resp = await fetch(imageUrl, { redirect: 'follow' });
if (!resp.ok) throw new Error('Download failed: ' + resp.status + ' for URL: ' + imageUrl);

const buf = Buffer.from(await resp.arrayBuffer());
const base64 = buf.toString('base64');

return [{
  json: {
    base64Data: base64
  }
}];`;

const fixedEscalateCode = `// Fetch image from MinIO and convert to base64
// Reference the Code in JavaScript node for the escalate/simulator path
const codeNode = $('Code in JavaScript');
const simNode = $('Process Sim Response');
let imageUrl;
try { imageUrl = codeNode.item.json.waha_image_url; } catch(e) {}
if (!imageUrl) {
  try { imageUrl = simNode.item.json.waha_image_url; } catch(e) {}
}
if (!imageUrl) {
  return [{ json: { error: 'No image URL found' } }];
}

const resp = await fetch(imageUrl, { redirect: 'follow' });
if (!resp.ok) throw new Error('Download failed: ' + resp.status + ' for URL: ' + imageUrl);

const buf = Buffer.from(await resp.arrayBuffer());
const base64 = buf.toString('base64');

return [{
  json: {
    base64Data: base64
  }
}];`;

const fixedFileCode = `// Fetch PDF from MinIO and convert to base64
const codeNode = $('Code in JavaScript');
const simNode = $('Process Sim Response');
let fileUrl;
try { fileUrl = codeNode.item.json.waha_image_url; } catch(e) {}
if (!fileUrl) {
  try { fileUrl = simNode.item.json.waha_image_url; } catch(e) {}
}
if (!fileUrl) {
  return [{ json: { error: 'No file URL found' } }];
}

const resp = await fetch(fileUrl, { redirect: 'follow' });
if (!resp.ok) throw new Error('Download failed: ' + resp.status + ' for URL: ' + fileUrl);

const buf = Buffer.from(await resp.arrayBuffer());
const base64 = buf.toString('base64');

return [{
  json: {
    base64Data: base64
  }
}];`;

// Update the Code nodes
data.nodes.forEach(n => {
    if (n.name === 'Fetch & Encode Image' || n.name === 'Fetch & Encode Booking') {
        n.parameters.jsCode = fixedImageCode;
        console.log(`Fixed: ${n.name}`);
    }
    if (n.name === 'Fetch & Encode Escalate Img') {
        n.parameters.jsCode = fixedEscalateCode;
        console.log(`Fixed: ${n.name}`);
    }
    if (n.name === 'Fetch & Encode Escalate PDF') {
        n.parameters.jsCode = fixedFileCode;
        console.log(`Fixed: ${n.name}`);
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("\nDone! Code nodes now reference $('Code in JavaScript') directly.");
