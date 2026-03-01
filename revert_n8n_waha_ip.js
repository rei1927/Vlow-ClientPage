import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = fs.readFileSync(file, 'utf8');

// Replace 172.17.0.1:9005 with vlow_minio:9000
data = data.replace(/http:\/\/172\.17\.0\.1:9005/g, 'http://vlow_minio:9000');

fs.writeFileSync('n8n-workflow-handover.json', data);
console.log("Reverted IP successfully.");
