import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api'; // Default NestJS port + prefix
const METRICS_URL = 'http://localhost:4000/metrics';
const VARIANT_ID = 'de85b073-82bb-41f2-8fad-5f1d077af832';
const WORKERS = 100;
const SESSION_ID = 'chaos-session-' + Math.random().toString(36).substring(7);

function unwrapApi<T>(res: any): T {
    return (res?.data?.data ?? res?.data) as T;
}

function parseMetricValue(metrics: string, metricName: string): number | null {
    // Ex: cart_concurrency_conflicts_total 12
    const line = metrics
        .split('\n')
        .find((l) => l.startsWith(metricName + ' ') || l.startsWith(metricName + '{'));
    if (!line) return null;
    const parts = line.trim().split(' ');
    const value = Number(parts[parts.length - 1]);
    return Number.isFinite(value) ? value : null;
}

async function runChaos() {
    console.log(`Starting FAANG Chaos Test with ${WORKERS} workers...`);
    console.log(`Session ID: ${SESSION_ID}`);
    console.log(`Variant ID: ${VARIANT_ID}`);

    const results = {
        success: 0,
        conflict: 0,
        error: 0,
        idempotent: 0
    };

    // 1) Baseline metrics (before)
    let conflictsBefore: number | null = null;
    try {
        const metricsBefore = await axios.get(METRICS_URL);
        conflictsBefore = parseMetricValue(metricsBefore.data, 'cart_concurrency_conflicts_total');
    } catch {
        // ignore
    }

    // 2) Get initial cart version (we will intentionally send it as stale)
    const initialCartRes = await axios.get(`${BASE_URL}/cart`, {
        headers: { 'x-client-session-id': SESSION_ID }
    });
    const initialCart = unwrapApi<any>(initialCartRes);
    const initialVersion = Number(initialCart.version || 1);
    console.log(`Initial Cart Version: ${initialVersion}`);

    const promises: Promise<any>[] = [];

    // Create a mix of requests:
    // - Some with different idempotency keys
    // - Some with SAME idempotency keys (should be handled)
    // - Some with stale versions (should trigger 409)

    for (let i = 0; i < WORKERS; i++) {
        const useSameKey = i % 10 === 0;
        const idempotencyKey = useSameKey ? 'same-key-123' : `key-${i}-${Math.random()}`;

        // Latency jitter
        const delay = Math.random() * 800;

        // Force stale version on a meaningful slice of workers.
        // With strict backend version checks + concurrent mutations, this should yield 409s and bump the conflict metric.
        const useStaleVersion = i % 3 === 0; // ~33%
        const versionToSend = useStaleVersion ? initialVersion : undefined;

        promises.push(new Promise(async (resolve) => {
            await new Promise(r => setTimeout(r, delay));
            try {
                await axios.post(`${BASE_URL}/cart`, {
                    variantId: VARIANT_ID,
                    quantity: 1,
                    idempotencyKey: idempotencyKey,
                    ...(versionToSend !== undefined ? { version: versionToSend } : {})
                }, {
                    headers: { 'x-client-session-id': SESSION_ID }
                });
                
                if (useSameKey && i > 0) {
                    results.idempotent++;
                } else {
                    results.success++;
                }
            } catch (err: any) {
                if (err.response?.status === 409) {
                    results.conflict++;
                } else {
                    results.error++;
                    console.error(err.response?.data || err.message);
                }
            }
            resolve(null);
        }));
    }

    await Promise.all(promises);

    console.log('\n--- Chaos Results ---');
    console.log(`Total Requests: ${WORKERS}`);
    console.log(`Success: ${results.success}`);
    console.log(`Conflicts (409): ${results.conflict}`);
    console.log(`Idempotent Hits: ${results.idempotent}`);
    console.log(`Errors: ${results.error}`);

    // Verify final state
    try {
        const finalCart = await axios.get(`${BASE_URL}/cart`, {
            headers: { 'x-client-session-id': SESSION_ID }
        });
        const cartData = unwrapApi<any>(finalCart);
        const totalQty = cartData.items.find((i: any) => i.variantId === VARIANT_ID)?.quantity || 0;
        console.log(`Final Cart Quantity: ${totalQty}`);
        console.log(`Expected Quantity (Success): ${results.success}`);
        
        if (totalQty === results.success) {
            console.log('✅ Consistency Validated: Final state matches successful mutations.');
        } else {
            console.log('❌ Consistency Failed: Drift detected!');
        }
    } catch (e) {
        console.error('Failed to verify final state');
    }

    // Check Metrics
    try {
        const metrics = await axios.get(METRICS_URL);
        if (metrics.data.includes('cart_concurrency_conflicts_total')) {
            console.log('✅ Observability Validated: Prometheus metrics found.');
            const conflictsAfter = parseMetricValue(metrics.data, 'cart_concurrency_conflicts_total');
            console.log(`Metric Before: ${conflictsBefore ?? 'n/a'}`);
            console.log(`Metric After: ${conflictsAfter ?? 'n/a'}`);
            if (conflictsBefore !== null && conflictsAfter !== null) {
                console.log(`Metric Delta: ${conflictsAfter - conflictsBefore}`);
            }
        }
    } catch (e) {
        console.log('⚠️ Could not fetch metrics (is the server running with PrometheusModule?)');
    }
}

runChaos().catch(console.error);
