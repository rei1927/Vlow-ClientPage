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

        // Get stack env vars
        const stackRes = await fetch(`https://portainer.dayamedialangit.co.id/api/stacks/7`, { headers });
        const stack = await stackRes.json();
        const envMap = {};
        (stack.Env || []).forEach(e => { envMap[e.name] = e.value; });

        // Build environment array for the container
        const containerEnv = [
            'PORT=5000',
            'NODE_ENV=production',
            `DB_HOST=${envMap.DB_HOST || ''}`,
            `DB_USER=${envMap.DB_USER || ''}`,
            `DB_PASS=${envMap.DB_PASS || ''}`,
            `DB_NAME=${envMap.DB_NAME || ''}`,
            'DB_SSL=true',
            'MINIO_ENDPOINT=minio-api.dayamedialangit.co.id',
            'MINIO_PORT=443',
            'MINIO_USE_SSL=true',
            `MINIO_ACCESS_KEY=${envMap.MINIO_ACCESS_KEY || 'admin'}`,
            `MINIO_SECRET_KEY=${envMap.MINIO_SECRET_KEY || 'rahasia123'}`,
            `MINIO_BUCKET=${envMap.MINIO_BUCKET || 'vlow-client'}`,
            `MINIO_PUBLIC_URL=${envMap.MINIO_PUBLIC_URL || 'https://minio.dayamedialangit.co.id'}`,
            `JWT_SECRET=${envMap.JWT_SECRET || 'rahasia_aman'}`,
            `FRONTEND_URL=${envMap.FRONTEND_URL || 'http://localhost'}`,
            `WAHA_BASE_URL=${envMap.WAHA_BASE_URL || 'https://waha-plus.dayamedialangit.co.id'}`,
            `WAHA_API_KEY=${envMap.WAHA_API_KEY || ''}`,
            `N8N_SIMULATOR_URL=${envMap.N8N_SIMULATOR_URL || ''}`,
            `META_APP_ID=${envMap.META_APP_ID || ''}`,
            `META_APP_SECRET=${envMap.META_APP_SECRET || ''}`,
            `META_WEBHOOK_VERIFY_TOKEN=${envMap.META_WEBHOOK_VERIFY_TOKEN || 'vlow_rahasia_webhook_2026'}`,
            `SMTP_HOST=${envMap.SMTP_HOST || 'smtp.resend.com'}`,
            `SMTP_PORT=${envMap.SMTP_PORT || '465'}`,
            `SMTP_EMAIL=${envMap.SMTP_EMAIL || 'resend'}`,
            `SMTP_PASSWORD=${envMap.SMTP_PASSWORD || 're_DVhzLzW4_3Y7mDXR9KwfoA8iMhhzPgYGS'}`,
            `FROM_NAME=${envMap.FROM_NAME || 'Vlow System Admin'}`,
            `FROM_EMAIL=${envMap.FROM_EMAIL || 'no-reply@vlow.ai'}`,
        ];

        console.log("Creating server container with image: custom_vlow_server:v2");
        console.log("Environment vars count:", containerEnv.length);

        // Create container
        const createRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/create?name=vlow_server`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                Image: 'custom_vlow_server:v2',
                Env: containerEnv,
                ExposedPorts: { '5000/tcp': {} },
                HostConfig: {
                    PortBindings: {
                        '5000/tcp': [{ HostPort: '5000' }]
                    },
                    RestartPolicy: { Name: 'always' },
                    NetworkMode: '7_default'
                }
            })
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            console.log("Create failed:", err.substring(0, 300));
            return;
        }

        const { Id: containerId } = await createRes.json();
        console.log("Container created:", containerId.substring(0, 12));

        // Start container
        const startRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${containerId}/start`, {
            method: 'POST', headers
        });

        if (startRes.ok) {
            console.log("✅ Server container started successfully!");
        } else {
            console.log("Start failed:", await startRes.text());
        }

        // Verify
        const verifyRes = await fetch(`https://portainer.dayamedialangit.co.id/api/endpoints/${endpointId}/docker/containers/${containerId}/json`, { headers });
        const info = await verifyRes.json();
        console.log("State:", info.State.Status);
        console.log("Networks:", Object.keys(info.NetworkSettings.Networks).join(', '));

    } catch (err) {
        console.error("Error:", err.message);
    }
}
main();
