async function main() {
    try {
        const authRes = await fetch('https://portainer.dayamedialangit.co.id/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "admin", password: "Alamatgue123" })
        });
        const { jwt } = await authRes.json();
        const headers = { Authorization: `Bearer ${jwt}` };

        const epRes = await fetch('https://portainer.dayamedialangit.co.id/api/endpoints', { headers });
        const endpoints = await epRes.json();
        const endpointId = endpoints[0].Id;

        // Get server container
        const cRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers });
        const containers = await cRes.json();
        const serverC = containers.find(c => c.Names[0].includes('vlow_server'));

        if (!serverC) {
            console.log("Server container not found!");
            return;
        }

        // Get last 100 lines of logs
        const logRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${serverC.Id}/logs?stdout=true&stderr=true&tail=100`, { headers });
        const logs = await logRes.text();

        // Clean up docker log prefix bytes
        const cleanLogs = logs.replace(/[\x00-\x08]/g, '').replace(/[\x0e-\x1f]/g, '');
        console.log("=== SERVER LOGS (last 100 lines) ===");
        console.log(cleanLogs);

    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
