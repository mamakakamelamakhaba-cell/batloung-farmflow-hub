// Integration tests for the REST API.
// They run against your real MySQL database (the same one in .env).
// Every record they create uses a unique timestamp-based phone number and is
// deleted again afterwards, so your sample data stays untouched.
// Run with:  npm test
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { query, queryOne, transaction, ping, pool } from '../config/db.js';
import { createApiRouter } from '../server/api.js';

const stamp = Date.now().toString().slice(-7);

let server;
let baseUrl;
const created = { suppliers: [], fruits: [], vendors: [] };

beforeAll(async () => {
  await ping();
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter({ query, queryOne, transaction, ping }).router);
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(async () => {
  for (const id of created.suppliers) await query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
  for (const id of created.fruits) await query('DELETE FROM fruits WHERE fruit_id = ?', [id]);
  for (const id of created.vendors) await query('DELETE FROM vendors WHERE vendor_id = ?', [id]);
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

const api = async (path, init) => {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

describe('Health', () => {
  it('reports a live database connection with sample data', async () => {
    const { status, body } = await api('/health');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.records.suppliers).toBeGreaterThanOrEqual(5);
    expect(body.records.fruits).toBeGreaterThanOrEqual(5);
  });
});

describe('Suppliers', () => {
  it('lists suppliers', async () => {
    const { status, body } = await api('/suppliers');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(5);
  });

  it('only allows the eight South African provinces', async () => {
    const { status } = await api('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        businessName: 'Test Supplier',
        contactPerson: 'Test Person',
        phone: '+266 5000 000',
        province: 'Maseru',
        address: 'Test address',
      }),
    });
    expect(status).toBe(400);
  });

  it('rejects an empty business name', async () => {
    const { status } = await api('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        businessName: '',
        contactPerson: 'Test Person',
        phone: '+266 5000 000',
        province: 'Gauteng',
        address: 'Test address',
      }),
    });
    expect(status).toBe(400);
  });

  it('creates, reads and deletes a supplier', async () => {
    const payload = {
      businessName: `Test Orchard ${stamp}`,
      contactPerson: 'Lerato Mofokeng',
      phone: `+266 5${stamp.slice(0, 4)} ${stamp.slice(4)}`,
      province: 'Free State',
      address: '12 Test Street, Maseru',
    };
    const created1 = await api('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
    expect(created1.status).toBe(201);
    const id = created1.body.id ?? created1.body.supplierId;
    created.suppliers.push(id);

    const read = await api(`/suppliers/${id}`);
    expect(read.status).toBe(200);
    expect(read.body.province).toBe('Free State');

    const removed = await api(`/suppliers/${id}`, { method: 'DELETE' });
    expect(removed.status).toBe(204);

    const missing = await api(`/suppliers/${id}`);
    expect(missing.status).toBe(404);
  });
});

describe('Fruits', () => {
  it('rejects a negative price', async () => {
    const { status } = await api('/fruits', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Fruit',
        description: 'x',
        status: 'ACTIVE',
        smallPrice: -5,
        mediumPrice: 10,
        largePrice: 20,
      }),
    });
    expect(status).toBe(400);
  });

  it('creates a fruit and returns a 404 for an unknown id', async () => {
    const res = await api('/fruits', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test Berry ${stamp}`,
        description: 'Created by the automated test.',
        status: 'ACTIVE',
        smallPrice: 100,
        mediumPrice: 150,
        largePrice: 200,
      }),
    });
    expect(res.status).toBe(201);
    const id = res.body.id ?? res.body.fruitId;
    created.fruits.push(id);

    const missing = await api('/fruits/99999999');
    expect(missing.status).toBe(404);
  });
});

describe('Sales and stock rules', () => {
  it('refuses to sell more boxes than are in stock', async () => {
    const fruits = await api('/fruits');
    const fruit = fruits.body[0];
    const vendors = await api('/vendors');
    const vendor = vendors.body[0];

    const res = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        vendorId: vendor.id,
        saleDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'CASH',
        paidAmount: 0,
        items: [{ fruitId: fruit.id, packagingSize: 'LARGE', quantity: 999999 }],
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('rejects a sale with no items', async () => {
    const vendors = await api('/vendors');
    const res = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        vendorId: vendors.body[0].id,
        saleDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'CASH',
        items: [],
      }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Reports', () => {
  it('returns a dashboard summary', async () => {
    const { status, body } = await api('/reports/summary');
    expect(status).toBe(200);
    expect(body).toHaveProperty('totalStockBoxes');
  });

  it('rejects an invalid date range', async () => {
    const { status } = await api('/reports/revenue?startDate=2026-05-01&endDate=2026-04-01');
    expect(status).toBe(400);
  });
});

describe('Routing errors', () => {
  it('returns 404 JSON for an unknown endpoint', async () => {
    const { status, body } = await api('/does-not-exist');
    expect(status).toBe(404);
    expect(body.error).toBeTruthy();
  });
});
