const autocannon = require('autocannon');

/**
 * Autocannon stress test scenario.
 * TARGETING CRITICAL SYSTEM ENDPOINTS
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

async function runStress() {
    console.log('🚀 Starting Stress Test (10000 Connections)...');

    const instance = autocannon({
        url: BASE_URL,
        connections: 10000,
        duration: 60,
        pipelining: 1,
        title: 'Critical Path Stress',
        requests: [
            {
                method: 'POST',
                path: '/api/auth/login',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'stress-user@example.com', password: 'password123' }),
            },
            {
                method: 'GET',
                path: '/api/products?limit=10',
            },
            {
                method: 'POST',
                path: '/api/cart',
                headers: { 'Content-Type': 'application/json', 'x-client-session-id': 'stress-session-123' },
                body: JSON.stringify({ variantId: '00000000-0000-0000-0000-000000000000', quantity: 1 }),
            },
            {
                method: 'POST',
                path: '/api/checkout/validate',
                headers: { 'Content-Type': 'application/json', 'x-client-session-id': 'stress-session-123' },
            }
        ]
    }, (err, result) => {
        if (err) {
            console.error('❌ Stress Test Failed:', err);
            process.exit(1);
        }
        console.log('✅ Stress Test Results:');
        console.log(`- Req/sec: ${result.requests.average}`);
        console.log(`- Latency P99: ${result.latency.p99} ms`);

        if (result.latency.p99 > 500) {
            console.warn('⚠️ WARNING: P99 exceeds 500ms budget!');
        }
    });

    autocannon.track(instance, { renderProgressBar: true });
}

runStress();
