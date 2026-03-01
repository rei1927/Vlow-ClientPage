import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = fs.readFileSync(file, 'utf8');

// Replace the hacky waha_image_url logic with clean welcomeImageUrl
data = data.replace(/waha_image_url: welcomeImageUrl && welcomeImageUrl\.includes\('minio\.dayamedialangit\.co\.id'\) \? welcomeImageUrl\.replace\('https:\/\/minio\.dayamedialangit\.co\.id', 'http:\/\/vlow_minio:9000'\) : welcomeImageUrl,/g, 'waha_image_url: welcomeImageUrl,');

data = data.replace(/waha_image_url: imageUrl && imageUrl\.includes\('minio\.dayamedialangit\.co\.id'\) \? imageUrl\.replace\('https:\/\/minio\.dayamedialangit\.co\.id', 'http:\/\/vlow_minio:9000'\) : imageUrl/g, 'waha_image_url: imageUrl');

fs.writeFileSync('n8n-workflow-handover.json', data);
console.log("Cleaned N8N WAHA URL successfully.");
