async function main() {
    try {
        const authRes = await fetch('https://portainer.dayamedialangit.co.id/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "admin", password: "Alamatgue123" })
        });
        const { jwt } = await authRes.json();
        const headers = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };

        const epRes = await fetch('https://portainer.dayamedialangit.co.id/api/endpoints', { headers });
        const endpoints = await epRes.json();
        const endpointId = endpoints[0].Id;

        // Check containers
        const cRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers });
        const containers = await cRes.json();

        console.log("=== Current Containers ===");
        containers.forEach(c => {
            console.log(`${c.Names[0].padEnd(30)} State: ${c.State.padEnd(10)} Status: ${c.Status}`);
        });

        const serverC = containers.find(c => c.Names[0].includes('vlow_server'));
        const clientC = containers.find(c => c.Names[0].includes('vlow_client'));

        if (!serverC) {
            console.log("\n⚠️  Server container NOT FOUND - it was deleted!");
            console.log("Need to recreate via docker compose on Proxmox console.");

            // Try to use stack update to recreate
            console.log("\nAttempting stack 7 update without pull...");
            const stackRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks/7`, { headers });
            const stack = await stackRes.json();
            console.log("Stack 7 status:", stack.Status, "Type:", stack.Type);

            // Try git redeploy WITHOUT pullImage
            const redeployRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks/7/git/redeploy?endpointId=${endpointId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    env: stack.Env || [],
                    prune: false,
                    pullImage: false,  // Don't try to pull - use local images
                    repositoryReferenceName: "refs/heads/main"
                })
            });

            if (redeployRes.ok) {
                console.log("✅ Stack 7 redeployed (no pull)!");
            } else {
                const errText = await redeployRes.text();
                console.log("Redeploy result:", redeployRes.status, errText.substring(0, 500));
            }
        } else {
            console.log("\nServer container exists:", serverC.State);
            if (serverC.State !== 'running') {
                // Start it
                const startRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${serverC.Id}/start`, { method: 'POST', headers });
                console.log("Start result:", startRes.ok ? "OK" : await startRes.text());
            }
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
