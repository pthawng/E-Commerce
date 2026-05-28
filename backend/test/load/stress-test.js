import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Stress test scenario.
 * 
 * Scenarios:
 * 1. Guest Browsing (GET /products)
 * 2. Add to Cart (POST /cart)
 * 3. Login Stress (POST /auth/login)
 * 4. Checkout Finalization (POST /checkout/validate)
 */

export const options = {
    stages: [
        { duration: '30s', target: 100 },   // Warmup
        { duration: '1m', target: 1000 },  // Ramp up to 1k
        { duration: '2m', target: 5000 },  // Ramp up to 5k
        { duration: '2m', target: 10000 }, // Peak: 10k users
        { duration: '1m', target: 0 },     // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(99)<500'], // P99 must be under 500ms
        http_req_failed: ['rate<0.01'],   // Error rate must be < 1%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
    const sessionId = `stress-session-${__VU}-${__ITER}`;
    const headers = { 'Content-Type': 'application/json', 'x-client-session-id': sessionId };

    // 1. Browsing
    let res = http.get(`${BASE_URL}/products?limit=10`, { headers });
    check(res, { 'status is 200': (r) => r.status === 200 });

    sleep(1);

    // 2. Add to Cart (Stressful DB Write)
    const payload = JSON.stringify({
        variantId: 'stress-test-variant-uuid', // Placeholder
        quantity: 1,
    });
    res = http.post(`${BASE_URL}/cart`, payload, { headers });
    check(res, { 'add to cart success': (r) => r.status === 201 || r.status === 200 });

    sleep(1);

    // 3. Login Attempt (Stressful Argon2 CPU)
    const loginPayload = JSON.stringify({
        email: 'stress-user@example.com',
        password: 'password123',
    });
    res = http.post(`${BASE_URL}/auth/login`, loginPayload, { headers });
    check(res, { 'login attempt response': (r) => r.status < 500 });

    sleep(2);
}
