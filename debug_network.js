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

        console.log("=== ALL CONTAINERS AND THEIR NETWORKS ===\n");
        containersData.forEach(c => {
            const nets = Object.keys(c.NetworkSettings.Networks);
            const ips = Object.entries(c.NetworkSettings.Networks).map(([name, n]) => `${name}=${n.IPAddress}`);
            console.log(`${c.Names[0].padEnd(40)} State: ${c.State.padEnd(10)} Networks: ${ips.join(', ')}`);
        });

        console.log("\n=== NETWORKS ===\n");
        const networksRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/networks`, {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        const networksData = await networksRes.json();
        networksData.filter(n => n.Driver === 'bridge').forEach(n => {
            const containers = Object.entries(n.Containers || {}).map(([id, c]) => c.Name);
            console.log(`Network: ${n.Name.padEnd(30)} Containers: ${containers.join(', ')}`);
        });

    } catch (err) {
        console.error("Error:", err);
    }
}
main();
