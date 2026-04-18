/**
 * Staff-grade Deployment Health Verifier.
 * Performs exponential backoff polling on the production health endpoint.
 * Uses native fetch (Node 22+) to avoid external dependencies.
 */
async function verifyDeploy() {
    const healthUrl = process.env.DEPLOY_HEALTH_URL;
    const maxRetries = 15;
    const initialDelay = 5000;

    if (!healthUrl) {
        console.error('❌ DEPLOY_HEALTH_URL not provided.');
        process.exit(1);
    }

    console.log(`🔍 Starting Post-Deploy Health Verification for: ${healthUrl}`);

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
                console.log('✅ Deployment verified! Service is healthy.');
                process.exit(0);
            }
            console.warn(`⏳ Service returned status ${response.status}. Retrying...`);
        } catch (error: any) {
            const delay = initialDelay * Math.pow(1.1, i);
            console.warn(`⏳ Attempt ${i + 1}/${maxRetries} failed: ${error.message}. Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error('❌ FATAL: Deployment verification timed out. Service may be unstable.');
    process.exit(1);
}

verifyDeploy();
