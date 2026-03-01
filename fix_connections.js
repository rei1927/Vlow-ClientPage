import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let raw = fs.readFileSync(file, 'utf8');

// Fix all broken references to deleted Download nodes
raw = raw.replace(/"Download Image 1"/g, '"Fetch & Encode Image"');
raw = raw.replace(/"Download Image Booking"/g, '"Fetch & Encode Booking"');
raw = raw.replace(/"Download Image Escalate"/g, '"Fetch & Encode Escalate Img"');
raw = raw.replace(/"Download File Escalate"/g, '"Fetch & Encode Escalate PDF"');

fs.writeFileSync(file, raw);
console.log("Fixed all broken Download node references!");

// Verify
const verify = fs.readFileSync(file, 'utf8');
console.log("Remaining 'Download' refs:", (verify.match(/Download/g) || []).length);
console.log("'Fetch & Encode' refs:", (verify.match(/Fetch & Encode/g) || []).length);
