async function main() {
    try {
        // Auth
        const authRes = await fetch('https://portainer.dayamedialangit.co.id/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "admin", password: "Alamatgue123" })
        });
        const { jwt } = await authRes.json();
        const headers = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };

        // Get endpoint
        const epRes = await fetch('https://portainer.dayamedialangit.co.id/api/endpoints', { headers });
        const endpoints = await epRes.json();
        const endpointId = endpoints[0].Id;

        // Get server container ID
        const cRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers });
        const containers = await cRes.json();
        const serverContainer = containers.find(c => c.Names[0].includes('vlow_server'));

        if (!serverContainer) {
            console.log("Server container not found!");
            return;
        }
        console.log("Found server container:", serverContainer.Id.substring(0, 12));

        // Execute git pull + restart inside server container
        // Step 1: Clone latest code into tmp
        async function execInContainer(containerId, cmd) {
            console.log(`\nExecuting: ${cmd.join(' ').substring(0, 80)}...`);
            const execRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${containerId}/exec`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    AttachStdin: false, AttachStdout: true, AttachStderr: true, Tty: false,
                    Cmd: cmd
                })
            });
            const { Id: execId } = await execRes.json();

            const startRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/exec/${execId}/start`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ Detach: false, Tty: false })
            });
            const output = await startRes.text();
            console.log("Output:", output.substring(0, 200));
            return output;
        }

        // We can't git clone inside the server container. Instead, we need to:
        // 1. Use Portainer's stack update feature, OR
        // 2. Recreate the container from the latest image

        // Let's use Portainer's stack redeploy feature
        // First, get the stack ID
        const stacksRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks`, { headers });
        const stacks = await stacksRes.json();
        console.log("\nAvailable stacks:", stacks.map(s => `${s.Id}: ${s.Name}`).join(', '));

        const vlowStack = stacks.find(s => s.Id === 7 || s.Name.toLowerCase().includes('vlow'));
        if (!vlowStack) {
            console.log("Vlow stack not found! Trying stack ID 7...");
        }

        const stackId = vlowStack?.Id || 7;
        console.log(`\nRedeploying stack ${stackId}...`);

        // Redeploy: Pull latest + rebuild
        const redeployRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks/${stackId}/git/redeploy?endpointId=${endpointId}`, {
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
            console.log("\n✅ Stack redeployed successfully!");
            console.log("Stack status:", result.Status);
        } else {
            const errText = await redeployRes.text();
            console.log("\nRedeploy via git failed:", redeployRes.status, errText.substring(0, 300));

            // Fallback: manually pull and rebuild
            console.log("\nFallback: Using docker exec to pull and rebuild...");

            // Find the portainer container or any container with docker access
            const portainerContainer = containers.find(c => c.Names[0].includes('portainer'));

            // Use Portainer exec websocket to run commands on the Docker host
            // Actually, let's just restart the containers which will pick up volume changes

            // The files were already copied via the volume path earlier in this conversation.
            // We just need to get the latest code there and restart.

            // Let's try using the Docker host exec through a privileged container
            console.log("\nAttempting to restart server container...");

            const restartRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${serverContainer.Id}/restart`, {
                method: 'POST',
                headers,
            });

            if (restartRes.ok) {
                console.log("✅ Server container restarted!");
            } else {
                console.log("Restart failed:", await restartRes.text());
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
