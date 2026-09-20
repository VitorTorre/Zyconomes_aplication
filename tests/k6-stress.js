import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 500 },  // Warm-up: Scale to 500 RPS
    { duration: '30s', target: 5000 }, // The Shock: 5000 RPS sustained
    { duration: '10s', target: 0 },    // Cooldown
  ],
  thresholds: {
    // 95% of requests must complete within 40ms. If not, the test FAILS.
    http_req_duration: ['p(95)<40'],
    // Maximum of 1% error rate tolerated (circuit breaker)
    http_req_failed: ['rate<0.01'], 
  },
};

export default function () {
  const payload = JSON.stringify({ 
    email: `stress_${__VU}_${__ITER}@zyconomes.com`,
    nome_completo: `User ${__VU} ${__ITER}`,
    cpf: `000000000${__VU%100}`,
    senha_plana: 'SenhaForte123!'
  });
  
  const params = { 
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Cadastro Endpoint' }
  };
  
  // Assuming the backend is running on port 3000
  const res = http.post('http://localhost:3000/api/v1/usuarios', payload, params);
  
  check(res, { 
    'status is 200 (Success) or 409 (Idempotent Conflict)': (r) => r.status === 200 || r.status === 409,
    'latency under 40ms': (r) => r.timings.duration < 40
  });
}
