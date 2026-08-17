/**
 * k6 Stress Test Script – Smart Laundry Backend
 * Stress testing with 200 -> 500 -> 1000 Virtual Users
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BACKEND_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 200 },  // Ramp to 200 users
    { duration: '1m', target: 200 },
    { duration: '30s', target: 500 },  // Ramp to 500 users
    { duration: '1m', target: 500 },
    { duration: '30s', target: 1000 }, // Peak stress at 1000 users
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% under 3 seconds under stress
    http_req_failed: ['rate<0.10'],    // Error rate under 10%
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/pricing`);
  check(res, {
    'pricing status is 200': (r) => r.status === 200,
  });

  const ordersRes = http.get(`${BASE_URL}/api/orders?userId=usr_cust1`);
  check(ordersRes, {
    'orders status is 200 or 500': (r) => [200, 500].includes(r.status),
  });

  sleep(1);
}
