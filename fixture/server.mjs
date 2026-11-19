import { createServer } from 'node:http';

const records = new Set();
const signals = new Map();
const recordRoute = /^\/(isolated|shared|solo)\/records\/(reader|cleanup)$/;
const signalRoute = /^\/(isolated|shared|solo)\/signals\/(reader-ready|cleanup-done)(?:\/(\d+))?$/;

function send(response, status, body = '', type = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  response.end(body);
}

const server = createServer((request, response) => {
  const { method, url } = request;
  if (method === 'GET' && url === '/health') return send(response, 200, 'OK');

  const record = recordRoute.exec(url);
  if (record) {
    const [, scenario, owner] = record;
    // The shared case models two tests seeding the same hard-coded record ID.
    const recordId = scenario === 'isolated' ? owner : 'fixed-test-id';
    const key = `${scenario}:${recordId}`;
    if (method === 'PUT') {
      records.add(key);
      return send(response, 204);
    }
    if (method === 'DELETE') {
      return send(response, records.delete(key) ? 204 : 404);
    }
    if (method === 'GET' && records.has(key)) {
      return send(response, 200, '<!doctype html><h1>Seeded test record</h1>', 'text/html; charset=utf-8');
    }
  }

  const signal = signalRoute.exec(url);
  if (signal) {
    const [, scenario, name, worker] = signal;
    const key = `${scenario}:${name}`;
    if (method === 'PUT' && worker !== undefined) {
      signals.set(key, Number(worker));
      return send(response, 204);
    }
    if (method === 'GET' && worker === undefined && signals.has(key)) {
      return send(response, 200, JSON.stringify({ worker: signals.get(key) }), 'application/json');
    }
  }

  return send(response, 404, 'Not found');
});

server.on('error', (error) => {
  console.error('Fixture server could not start:', error);
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1');
