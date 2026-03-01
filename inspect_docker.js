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

        // 1. Check available images
        const imgRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/images/json`, { headers });
        const images = await imgRes.json();

        console.log("=== Docker Images ===");
        const serverImg = images.find(i => i.RepoTags && i.RepoTags.some(t => t.includes('vlow') && t.includes('server')));
        images.filter(i => i.RepoTags && i.RepoTags.some(t => t.includes('vlow') || t.includes('custom'))).forEach(i => {
            console.log(i.RepoTags?.join(', '), '| Size:', Math.round(i.Size / 1024 / 1024) + 'MB');
        });

        if (!serverImg) {
            console.log("\n⚠️ No server image found! Need to build from source.");

            // Check ALL images
            console.log("\n=== ALL Images ===");
            images.forEach(i => console.log(i.RepoTags?.join(', ') || i.Id.substring(0, 20)));
            return;
        }

        const imgTag = serverImg.RepoTags[0];
        console.log(`\nUsing image: ${imgTag}`);

        // 2. Get stack env vars from stack 7
        const stackRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks/7`, { headers });
        const stack = await stackRes.json();
        const envVars = stack.Env || [];
        console.log(`\nStack env vars: ${envVars.length}`);

        // 3. Get network info from existing client container
        const cRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers });
        const containers = await cRes.json();
        const clientC = containers.find(c => c.Names[0].includes('vlow_client'));

        if (clientC) {
            const inspectRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${clientC.Id}/json`, { headers });
            const clientInspect = await inspectRes.json();
            const networks = Object.keys(clientInspect.NetworkSettings.Networks);
            console.log("Client networks:", networks);
        }

        // 4. Create server container from existing image
        // Map stack env into container env format
        const containerEnv = envVars.map(e => `${e.name}=${e.value}`);

        // Need to read the docker-compose to understand the service configuration
        const composeFileRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks/7/file`, { headers });
        const composeData = await composeFileRes.json();
        console.log("\nCompose file content (first 500 chars):", composeData.StackFileContent?.substring(0, 500));

        // Parse the compose to find server service config
        const composeContent = composeData.StackFileContent;
        console.log("\n=== Full compose file ===");
        console.log(composeContent);

    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
