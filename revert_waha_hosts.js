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
        const wahaContainer = containersData.find(c => c.Names[0].includes('waha'));
        
        const execRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${wahaContainer.Id}/exec`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}` 
            },
            body: JSON.stringify({
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                Tty: false,
                Cmd: ["sh", "-c", "sed -i '/minio.dayamedialangit.co.id/d' /etc/hosts"]
            })
        });
        
        const execData = await execRes.json();
        const execId = execData.Id;
        
        await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/exec/${execId}/start`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}` 
            },
            body: JSON.stringify({ Detach: false, Tty: false })
        });
        
        console.log("Reverted extra_hosts successfully!");
    } catch(err) {
        console.error("Error:", err);
    }
}
main();
