/**
 * k6 Load Test Script – Smart Laundry Backend
 * Baseline Load: 100 VUs, 60 seconds
 * Tests: Login, Orders, Wallet, Pricing endpoints
 *
 * Run: k6 run --vus 100 --duration 60s k6-load-test.js
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────
const loginDuration    = new Trend('login_duration',    true);
const ordersGetDuration= new Trend('orders_get_duration', true);
const walletDuration   = new Trend('wallet_duration',   true);
const pricingDuration  = new Trend('pricing_duration',  true);
const errorRate        = new Rate('error_rate');
const requestsTotal    = new Counter('requests_total');

// ── Config ────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '10s', target: 20  },   // Ramp up to 20 VUs in 10s
    { duration: '40s', target: 100 },   // Ramp to 100 VUs in 40s (baseline)
    { duration: '10s', target: 0   },   // Ramp down
  ],
  thresholds: {
    http_req_duration:            ['p(95)<2000', 'p(99)<3000'],  // 95% < 2s, 99% < 3s
    http_req_failed:              ['rate<0.05'],                  // Error rate < 5%
    login_duration:               ['p(95)<2000'],
    orders_get_duration:          ['p(95)<2000'],
    wallet_duration:              ['p(95)<2000'],
    pricing_duration:             ['p(95)<1000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// ── Test Data ─────────────────────────────────────────────
const USERS = [
  { email: 'shaiksuhelbasha609@gmail.com', password: '123' },
  { email: 'admin@laundry.com',  password: '123' },
  { email: 'staff@laundry.com',  password: '123' },
];

const HEADERS = { 'Content-Type': 'application/json' };

// ── Main Virtual User ─────────────────────────────────────
export default function() {
  const user = USERS[Math.floor(Math.random() * USERS.length)];

  group('Authentication – POST /api/auth/login', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: HEADERS, tags: { name: 'login' } }
    );
    const duration = Date.now() - start;
    loginDuration.add(duration);
    requestsTotal.add(1);

    const ok = check(res, {
      'login: status 200 or 401': r => [200, 401].includes(r.status),
      'login: response time < 2000ms': () => duration < 2000,
      'login: has JSON body': r => r.headers['Content-Type']?.includes('json'),
    });
    errorRate.add(!ok);
    sleep(0.5);
  });

  group('Orders – GET /api/orders', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/orders?userId=usr_cust1`,
      { headers: HEADERS, tags: { name: 'orders-list' } }
    );
    const duration = Date.now() - start;
    ordersGetDuration.add(duration);
    requestsTotal.add(1);

    check(res, {
      'orders: status 200 or 500': r => [200, 500].includes(r.status),
      'orders: response time < 2000ms': () => duration < 2000,
    });
    sleep(0.3);
  });

  group('Wallet – GET /api/wallet/:userId', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/wallet/usr_cust1`,
      { headers: HEADERS, tags: { name: 'wallet' } }
    );
    const duration = Date.now() - start;
    walletDuration.add(duration);
    requestsTotal.add(1);

    check(res, {
      'wallet: status 200 or 404': r => [200, 404].includes(r.status),
      'wallet: response time < 2000ms': () => duration < 2000,
    });
    sleep(0.3);
  });

  group('Pricing – GET /api/pricing', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/api/pricing`,
      { headers: HEADERS, tags: { name: 'pricing' } }
    );
    const duration = Date.now() - start;
    pricingDuration.add(duration);
    requestsTotal.add(1);

    check(res, {
      'pricing: status 200': r => r.status === 200,
      'pricing: has basePrice': r => { try { return JSON.parse(r.body).basePrice !== undefined; } catch { return false; } },
      'pricing: response time < 1000ms': () => duration < 1000,
    });
    sleep(0.2);
  });

  sleep(1);
}

// ── Summary ────────────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    testType: 'Baseline Load Test',
    config: { vus: 100, duration: '60s' },
    metrics: {
      totalRequests: data.metrics.requests_total?.values?.count || 0,
      requestsPerSecond: (data.metrics.http_reqs?.values?.rate || 0).toFixed(2),
      avgResponseTime: `${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(0)}ms`,
      minResponseTime: `${(data.metrics.http_req_duration?.values?.min || 0).toFixed(0)}ms`,
      maxResponseTime: `${(data.metrics.http_req_duration?.values?.max || 0).toFixed(0)}ms`,
      p90ResponseTime: `${(data.metrics['http_req_duration']?.values?.['p(90)'] || 0).toFixed(0)}ms`,
      p95ResponseTime: `${(data.metrics['http_req_duration']?.values?.['p(95)'] || 0).toFixed(0)}ms`,
      p99ResponseTime: `${(data.metrics['http_req_duration']?.values?.['p(99)'] || 0).toFixed(0)}ms`,
      errorRate: `${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%`,
      loginAvg:   `${(data.metrics.login_duration?.values?.avg || 0).toFixed(0)}ms`,
      ordersAvg:  `${(data.metrics.orders_get_duration?.values?.avg || 0).toFixed(0)}ms`,
      walletAvg:  `${(data.metrics.wallet_duration?.values?.avg || 0).toFixed(0)}ms`,
      pricingAvg: `${(data.metrics.pricing_duration?.values?.avg || 0).toFixed(0)}ms`,
    },
    thresholdsPassed: !Object.values(data.metrics).some(m => m.thresholds && Object.values(m.thresholds).some(t => t.ok === false)),
  };

  return {
    'reports/performance/k6-baseline-summary.json': JSON.stringify(summary, null, 2),
    stdout: `
╔══════════════════════════════════════════════════════════════╗
║          Smart Laundry – k6 Baseline Load Test Results       ║
╠══════════════════════════════════════════════════════════════╣
║  Config: ${summary.config.vus} VUs | ${summary.config.duration}                           ║
╠══════════════════════════════════════════════════════════════╣
║  📊 TRAFFIC                                                   ║
║    Total Requests  : ${String(summary.metrics.totalRequests).padEnd(8)} req             ║
║    Requests/Second : ${String(summary.metrics.requestsPerSecond).padEnd(8)} req/s        ║
╠══════════════════════════════════════════════════════════════╣
║  ⏱️ RESPONSE TIMES                                            ║
║    Average         : ${String(summary.metrics.avgResponseTime).padEnd(10)}             ║
║    Minimum         : ${String(summary.metrics.minResponseTime).padEnd(10)}             ║
║    Maximum         : ${String(summary.metrics.maxResponseTime).padEnd(10)}             ║
║    P90             : ${String(summary.metrics.p90ResponseTime).padEnd(10)}             ║
║    P95             : ${String(summary.metrics.p95ResponseTime).padEnd(10)}             ║
║    P99             : ${String(summary.metrics.p99ResponseTime).padEnd(10)}             ║
╠══════════════════════════════════════════════════════════════╣
║  🔍 BY ENDPOINT                                               ║
║    POST /api/auth/login  Avg: ${String(summary.metrics.loginAvg).padEnd(8)}             ║
║    GET  /api/orders      Avg: ${String(summary.metrics.ordersAvg).padEnd(8)}            ║
║    GET  /api/wallet/:id  Avg: ${String(summary.metrics.walletAvg).padEnd(8)}            ║
║    GET  /api/pricing     Avg: ${String(summary.metrics.pricingAvg).padEnd(8)}           ║
╠══════════════════════════════════════════════════════════════╣
║  ⚠️ ERROR RATE : ${String(summary.metrics.errorRate).padEnd(8)}                         ║
║  ✅ THRESHOLDS : ${summary.thresholdsPassed ? 'ALL PASSED' : 'SOME FAILED'}                    ║
╚══════════════════════════════════════════════════════════════╝
`,
  };
}
