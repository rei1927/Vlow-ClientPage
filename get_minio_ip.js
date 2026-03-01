async function main() {
    try {
        const authRes = await fetch('https://portainer.dayamedialangit.co.id/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "admin", password: "Alamatgue123" })
        });
        const authData = await authRes.json();
        const jwt = authData.jwt;

        const endpointsRes = await fetch('https://portainer.dayamedialangit.co.id/api/endpoints', {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const endpointsData = await endpointsRes.json();
        const endpointId = endpointsData[0].Id;
        
        const containersRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const containersData = await containersRes.json();
        
        const minioContainer = containersData.find(c => c.Names[0].includes('minio'));
        const wahaContainer = containersData.find(c => c.Names[0].includes('waha'));
        
        console.log("MinIO Networks:", JSON.stringify(minioContainer.NetworkSettings.Networks, null, 2));
        console.log("WAHA Networks:", JSON.stringify(wahaContainer.NetworkSettings.Networks, null, 2));
    } catch(err) {
        console.error("Error:", err);
    }
}
main();
