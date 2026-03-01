import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = fs.readFileSync(file, 'utf8');

// Replace vlow_minio:9000 with 172.17.0.1:9005
data = data.replace(/http:\/\/vlow_minio:9000/g, 'http://172.17.0.1:9005');

fs.writeFileSync('n8n-workflow-handover.json', data);
console.log("Patched IP successfully.");
