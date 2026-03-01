async function main() {
    try {
        const authRes = await fetch('https://portainer.dayamedialangit.co.id/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "admin", password: "Alamatgue123" })
        });
        const authData = await authRes.json();
        const jwt = authData.jwt;
        console.log("Logged into Portainer.");

        const endpointsRes = await fetch('https://portainer.dayamedialangit.co.id/api/endpoints', {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const endpointsData = await endpointsRes.json();
        const endpointId = endpointsData[0].Id;

        // Find WAHA network
        const networksRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/networks`, {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const networksData = await networksRes.json();

        const vlowNet = networksData.find(n => n.Name === '7_default');
        const wahaNet = networksData.find(n => n.Name.includes('waha'));

        console.log("Vlow Network ID:", vlowNet?.Id);
        console.log("WAHA Network:", wahaNet?.Name);

        // Find WAHA Container
        const containersRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const containersData = await containersRes.json();
        const wahaContainer = containersData.find(c => c.Names[0].includes('waha'));
        console.log("WAHA Container ID:", wahaContainer?.Id);

        if (wahaContainer && vlowNet) {
            console.log("Attempting to attach WAHA to Vlow network...");
            const attach = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/networks/${vlowNet.Id}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`
                },
                body: JSON.stringify({ Container: wahaContainer.Id })
            });

            if (attach.ok) {
                console.log("Successfully attached WAHA to Vlow network!");
            } else {
                const errText = await attach.text();
                console.log("Attach failed (maybe already attached):", errText);
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
main();
