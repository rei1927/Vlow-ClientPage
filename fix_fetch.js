import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// N8N Code nodes run in a sandboxed VM where fetch() is NOT available.
// We must use require('https') / require('http') which ARE available.

const downloadHelper = `
function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}`;

const fixedImageCode = `${downloadHelper}

const imageUrl = $('Code in JavaScript').item.json.waha_image_url;
if (!imageUrl) return [{ json: { error: 'No image URL' } }];

const buf = await downloadUrl(imageUrl);
const base64 = buf.toString('base64');

return [{ json: { base64Data: base64 } }];`;

const fixedEscalateCode = `${downloadHelper}

let imageUrl;
try { imageUrl = $('Code in JavaScript').item.json.waha_image_url; } catch(e) {}
if (!imageUrl) {
  try { imageUrl = $('Process Sim Response').item.json.waha_image_url; } catch(e) {}
}
if (!imageUrl) return [{ json: { error: 'No image URL' } }];

const buf = await downloadUrl(imageUrl);
const base64 = buf.toString('base64');

return [{ json: { base64Data: base64 } }];`;

data.nodes.forEach(n => {
    if (n.name === 'Fetch & Encode Image' || n.name === 'Fetch & Encode Booking') {
        n.parameters.jsCode = fixedImageCode;
        console.log(`Fixed: ${n.name}`);
    }
    if (n.name === 'Fetch & Encode Escalate Img' || n.name === 'Fetch & Encode Escalate PDF') {
        n.parameters.jsCode = fixedEscalateCode;
        console.log(`Fixed: ${n.name}`);
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("Done! All Code nodes now use require('https') instead of fetch().");
