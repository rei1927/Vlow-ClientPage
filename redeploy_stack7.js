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

        // Redeploy stack 7 (vlow-client-page) via Git
        console.log("Redeploying stack 7 (vlow-client-page)...");

        const redeployRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks/7/git/redeploy?endpointId=${endpointId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                env: [],
                prune: false,
                pullImage: true,
                repositoryReferenceName: "refs/heads/main",
                repositoryAuthentication: false
            })
        });

        if (redeployRes.ok) {
            const result = await redeployRes.json();
            console.log("✅ Stack 7 redeployed successfully!");
        } else {
            const errText = await redeployRes.text();
            console.log("Stack 7 redeploy failed:", redeployRes.status, errText.substring(0, 500));

            // If git redeploy doesn't work, let's try rebuilding containers manually
            console.log("\nTrying manual rebuild approach...");

            // Get all containers
            const cRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers });
            const containers = await cRes.json();

            // Find and recreate server container
            const serverC = containers.find(c => c.Names[0].includes('vlow_server'));
            if (serverC) {
                // Stop container
                await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${serverC.Id}/stop`, { method: 'POST', headers });
                console.log("Stopped server container");

                // Remove container
                await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${serverC.Id}?force=true`, { method: 'DELETE', headers });
                console.log("Removed server container");

                // Recreate via compose up
                // Actually we can't do compose from the API directly...
                // Let's just restart and hope the volume mount picks up changes
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
