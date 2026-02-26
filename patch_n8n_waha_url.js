import fs from 'fs';

const file = 'n8n-workflow-handover.json';
let data = fs.readFileSync(file, 'utf8');

// 1. Patch Code in JavaScript
data = data.replace(
    /welcome_image_url: welcomeImageUrl,\s*\/\/\s*N8N WAHA akan otomatis ngirim ini sebagai gambar!/,
    "welcome_image_url: welcomeImageUrl, waha_image_url: welcomeImageUrl && welcomeImageUrl.includes('minio.dayamedialangit.co.id') ? welcomeImageUrl.replace('https://minio.dayamedialangit.co.id', 'http://vlow_minio:9000') : welcomeImageUrl,"
);

// 2. Patch Process Sim Response
data = data.replace(
    /welcome_image_url: imageUrl\s*\}\s*\}\];/,
    "welcome_image_url: imageUrl, waha_image_url: imageUrl && imageUrl.includes('minio.dayamedialangit.co.id') ? imageUrl.replace('https://minio.dayamedialangit.co.id', 'http://vlow_minio:9000') : imageUrl } }];"
);

// 3. Patch WAHA nodes referencing welcome_image_url
// specifically line 1057, 1187, 1812, 1841
data = data.replace(/"url":\s*"\{\{\$\('Code in JavaScript'\)\.item\.json\.welcome_image_url\}\}"/g, '"url": "{{$(\'Code in JavaScript\').item.json.waha_image_url}}"');
data = data.replace(/"url":\s*"\{\{\s*\$json\.welcome_image_url\s*\}\}"/g, '"url": "{{ $json.waha_image_url }}"');

fs.writeFileSync('n8n-workflow-handover_patched.json', data);
console.log("Patched successfully.");
