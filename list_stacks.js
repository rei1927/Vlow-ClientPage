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
        
        const stacksRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/edge/stacks`, {
            headers: { Authorization: `Bearer ${jwt}` }
        });
        
        let stacksData;
        if(stacksRes.ok) stacksData = await stacksRes.json();
        else {
             const stacksRes2 = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks`, {
                 headers: { Authorization: `Bearer ${jwt}` }
             });
             stacksData = await stacksRes2.json();
        }
        
        console.log("Stacks:", stacksData.map(s => s.Name));
    } catch(err) {
        console.error("Error:", err);
    }
}
main();
