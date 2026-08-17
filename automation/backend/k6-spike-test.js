/**
 * k6 Spike Test Script – Smart Laundry Backend
 * Sudden spike from 50 to 500 Virtual Users
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BACKEND_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Low baseline traffic
    { duration: '10s', target: 500 },  // Instant spike to 500 VUs
    { duration: '30s', target: 500 },  // Hold spike
    { duration: '10s', target: 50 },   // Recovery back down
    { duration: '20s', target: 50 },   // Recovery observation
    { duration: '10s', target: 0 },    // Cooldown
  ],
  thresholds: {
    http_req_duration: ['p(95)<4000'],
    http_req_failed: ['rate<0.15'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/pricing`);
  check(res, {
    'spike response is 200': (r) => r.status === 200,
  });
  sleep(0.5);
}
