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

        // Get networks
        const networksRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/networks`, {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const networksData = await networksRes.json();
        const vlowNet = networksData.find(n => n.Name === '7_default');

        // Get containers
        const containersRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const containersData = await containersRes.json();
        const n8nContainer = containersData.find(c => c.Names[0].includes('n8n'));

        console.log("N8N Container:", n8nContainer.Id);
        console.log("Vlow Network:", vlowNet.Id);

        // Join N8N to Vlow network
        const attach = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/networks/${vlowNet.Id}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}`
            },
            body: JSON.stringify({ Container: n8nContainer.Id })
        });

        if (attach.ok) {
            console.log("Successfully attached N8N to Vlow network!");
        } else {
            const errText = await attach.text();
            console.log("Attach result:", errText);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
main();
