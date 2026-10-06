import http from 'http';

const ports = [
  { p: 5000, name: 'API Gateway' },
  { p: 5001, name: 'Auth & Identity Service' },
  { p: 5002, name: 'WebRTC Signaling & Consultation Service' },
  { p: 5003, name: 'EHR & Cryptographic Audit Service' },
  { p: 5004, name: 'Biometric Vitals Telemetry Service' },
  { p: 3000, name: 'Vite Frontend Client' }
];

let checked = 0;
console.log('--- MICROSERVICES HEALTH AUDIT ---');

ports.forEach(({ p, name }) => {
  const path = p === 3000 ? '/' : '/health';
  const req = http.get({ host: '127.0.0.1', port: p, path, timeout: 2000 }, (res) => {
    console.log(`[ONLINE] Port ${p.toString().padEnd(4)} | ${name.padEnd(42)} | Status ${res.statusCode}`);
    if (++checked === ports.length) process.exit(0);
  });
  req.on('error', (err) => {
    console.log(`[OFFLINE] Port ${p.toString().padEnd(4)} | ${name.padEnd(42)} | Error: ${err.message}`);
    if (++checked === ports.length) process.exit(0);
  });
});
