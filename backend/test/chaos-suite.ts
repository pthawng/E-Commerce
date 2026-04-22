import axios from 'axios';

/**
 * Ray Paradis Chaos Test Suite
 *
 * This script simulates "Staff/Principal" level stress scenarios:
 * 1. Price Stability Breach: Changing DB price mid-checkout.
 * 2. Payment Race: Concurrent Webhook + Redirect within 1ms.
 * 3. Lock Contention: 100 users trying to buy the LAST unit.
 */

const API_BASE = 'http://localhost:4000/api';

async function runChaos() {
  console.log('🚀 Starting Ray Paradis Bulletproof Chaos Suite...');

  // TEST 1: The "Webhook vs Redirect" Paradox
  // Simulated by firing two identical callback requests simultaneously
  console.log('\n--- Scenario 1: Webhook vs Redirect Race ---');
  const mockVnPayQuery = {
    vnp_Amount: '1000000',
    vnp_OrderInfo: 'Mock order',
    vnp_ResponseCode: '00',
    vnp_TxnRef: 'MOCK_TX_' + Date.now(),
    vnp_SecureHash: 'MOCK_HASH', // Assume bypass in Test mode
  };

  const startTime = Date.now();
  const results = await Promise.allSettled([
    axios.get(`${API_BASE}/payment/vnpay/callback`, { params: mockVnPayQuery }),
    axios.get(`${API_BASE}/payment/vnpay/ipn`, { params: mockVnPayQuery }),
  ]);

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  const conflictCount = results.filter(
    (r) => r.status === 'rejected' && (r as any).reason.response?.status === 409,
  ).length;

  console.log(`- Total Requests: 2`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Handled Conflicts (Atomic Lock): ${conflictCount}`);
  console.log(`- Latency: ${Date.now() - startTime}ms`);

  // TEST 2: Lock Contention (High Concurrency)
  console.log('\n--- Scenario 2: High Concurrency Checkout (100 parallel) ---');
  // ... more logic here for k6 or artillery integration
}

// runChaos(); // To be run in a dedicated test environment
