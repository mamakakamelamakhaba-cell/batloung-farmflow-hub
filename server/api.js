// REST API for the Batloung Farm Distribution System, backed by MySQL.
// Mounted at /api by server/index.js.
import express from 'express';
import { createFarmRepository } from './farm.repository.js';

const PROVINCES = ['Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West'];
const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];

// ------------------------------------------------------------------ validation
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isId = (v) => Number.isInteger(v) && v > 0;
const isMoney = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 99999999;
const str = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

function fail(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  throw e;
}

const validators = {
  supplier(body) {
    if (!str(body.businessName, 2, 140)) fail('Business name must be 2–140 characters.');
    if (!str(body.contactPerson, 2, 120)) fail('Contact person must be 2–120 characters.');
    if (!str(body.phone, 5, 40)) fail('Phone number must be 5–40 characters.');
    if (!PROVINCES.includes(body.province)) fail(`Province must be one of: ${PROVINCES.join(', ')}.`);
    if (!str(body.address, 3, 255)) fail('Address must be 3–255 characters.');
    return {
      businessName: body.businessName.trim(),
      contactPerson: body.contactPerson.trim(),
      phone: body.phone.trim(),
      province: body.province,
      address: body.address.trim(),
    };
  },

  fullFruit(body) {
    if (!str(body.name, 2, 60)) fail('Fruit name must be 2–60 characters.');
    if (body.description !== undefined && typeof body.description !== 'string') fail('Description must be text.');
    if (!['ACTIVE', 'INACTIVE'].includes(body.status)) fail('Status must be ACTIVE or INACTIVE.');
    for (const k of ['smallPrice', 'mediumPrice', 'largePrice']) {
      if (!isMoney(body[k])) fail(`${k} must be a number between 0 and 99,999,999.`);
    }
    return {
      name: body.name.trim(),
      description: (body.description ?? '').slice(0, 2000),
      status: body.status,
      smallPrice: body.smallPrice,
      mediumPrice: body.mediumPrice,
      largePrice: body.largePrice,
    };
  },

  vendor(body) {
    if (!str(body.name, 2, 120)) fail('Vendor name must be 2–120 characters.');
    if (!str(body.phone, 5, 40)) fail('Phone number must be 5–40 characters.');
    if (!str(body.location, 2, 255)) fail('Location must be 2–255 characters.');
    if (!isDate(body.registrationDate)) fail('Registration date must be YYYY-MM-DD.');
    return {
      name: body.name.trim(),
      phone: body.phone.trim(),
      location: body.location.trim(),
      registrationDate: body.registrationDate,
    };
  },

  items(items) {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) fail('Add between 1 and 100 items.');
    return items.map((it) => {
      if (!isId(it.fruitId)) fail('Each item needs a valid fruit.');
      if (!SIZES.includes(it.packagingSize)) fail('Packaging size must be SMALL, MEDIUM or LARGE.');
      if (!Number.isInteger(it.quantity) || it.quantity < 1) fail('Each item needs a whole number of boxes above zero.');
      return it;
    });
  },

  purchase(body) {
    if (!isId(body.supplierId)) fail('Choose a supplier.');
    if (!isDate(body.purchaseDate)) fail('Purchase date must be YYYY-MM-DD.');
    const items = validators.items(body.items);
    for (const it of items) {
      if (typeof it.unitCost !== 'number' || !(it.unitCost > 0)) fail('Each item needs a unit cost above zero.');
    }
    return { supplierId: body.supplierId, purchaseDate: body.purchaseDate, items };
  },

  sale(body) {
    if (!isId(body.vendorId)) fail('Choose a vendor.');
    if (!isDate(body.saleDate)) fail('Sale date must be YYYY-MM-DD.');
    if (!['CASH', 'MOBILE_MONEY', 'CREDIT'].includes(body.paymentMethod)) fail('Payment method must be CASH, MOBILE_MONEY or CREDIT.');
    if (body.paidAmount !== undefined && (!isMoney(body.paidAmount))) fail('Paid amount must be zero or more.');
    return {
      vendorId: body.vendorId,
      saleDate: body.saleDate,
      paymentMethod: body.paymentMethod,
      paidAmount: body.paidAmount,
      items: validators.items(body.items),
    };
  },

  payment(body) {
    if (!['CASH', 'MOBILE_MONEY'].includes(body.paymentMethod)) fail('Payment method must be CASH or MOBILE_MONEY.');
    if (typeof body.amount !== 'number' || !(body.amount > 0)) fail('Enter a payment amount above zero.');
    return { paymentMethod: body.paymentMethod, amount: body.amount };
  },
};

/** Wrap an async route so errors reach the error handler. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toId = (raw) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) fail('Invalid record id.', 400);
  return n;
};

export function createApiRouter({ query, queryOne, transaction, ping }) {
  const repo = createFarmRepository(query, queryOne, transaction);
  const router = express.Router();

  // -------------------------------------------------------------- health
  router.get('/health', wrap(async (_req, res) => {
    const info = await ping();
    res.json({ status: 'ok', database: info.database, mysql: info.version, records: info.counts });
  }));

  // ------------------------------------------------------------- dashboard
  router.get('/dashboard/summary', wrap(async (_req, res) => res.json(await repo.report('summary'))));
  router.get('/dashboard/activity', wrap(async (_req, res) => res.json(await repo.report('activity'))));

  // ------------------------------------------------------------- suppliers
  router.get('/suppliers', wrap(async (_req, res) => res.json(await repo.suppliers.list())));
  router.get('/suppliers/:id', wrap(async (req, res) => res.json(await repo.suppliers.get(toId(req.params.id)))));
  router.post('/suppliers', wrap(async (req, res) => {
    const data = validators.supplier(req.body);
    res.status(201).json(await repo.suppliers.create(data));
  }));
  router.put('/suppliers/:id', wrap(async (req, res) => {
    const data = validators.supplier(req.body);
    res.json(await repo.suppliers.update(toId(req.params.id), data));
  }));
  router.delete('/suppliers/:id', wrap(async (req, res) => {
    await repo.suppliers.remove(toId(req.params.id));
    res.status(204).end();
  }));

  // ---------------------------------------------------------------- fruits
  router.get('/fruits', wrap(async (_req, res) => res.json(await repo.fruits.list())));
  router.get('/fruits/:id', wrap(async (req, res) => res.json(await repo.fruits.get(toId(req.params.id)))));
  router.post('/fruits', wrap(async (req, res) => {
    const data = validators.fullFruit(req.body);
    res.status(201).json(await repo.fruits.create(data));
  }));
  router.put('/fruits/:id', wrap(async (req, res) => {
    const body = req.body ?? {};
    const patch = {};
    if (body.name !== undefined) { if (!str(body.name, 2, 60)) fail('Fruit name must be 2–60 characters.'); patch.name = body.name.trim(); }
    if (body.description !== undefined) { if (typeof body.description !== 'string') fail('Description must be text.'); patch.description = body.description.slice(0, 2000); }
    if (body.status !== undefined) { if (!['ACTIVE', 'INACTIVE'].includes(body.status)) fail('Status must be ACTIVE or INACTIVE.'); patch.status = body.status; }
    for (const k of ['smallPrice', 'mediumPrice', 'largePrice']) {
      if (body[k] !== undefined) { if (!isMoney(body[k])) fail(`${k} must be a number between 0 and 99,999,999.`); patch[k] = body[k]; }
    }
    res.json(await repo.fruits.update(toId(req.params.id), patch));
  }));

  // --------------------------------------------------------------- vendors
  router.get('/vendors', wrap(async (req, res) => {
    res.json(await repo.vendors.list(typeof req.query.search === 'string' ? req.query.search : undefined));
  }));
  router.get('/vendors/balances', wrap(async (_req, res) => res.json(await repo.report('balances'))));
  router.get('/vendors/:id', wrap(async (req, res) => res.json(await repo.vendors.get(toId(req.params.id)))));
  router.post('/vendors', wrap(async (req, res) => {
    const data = validators.vendor(req.body);
    res.status(201).json(await repo.vendors.create(data));
  }));
  router.put('/vendors/:id', wrap(async (req, res) => {
    const data = validators.vendor(req.body);
    res.json(await repo.vendors.update(toId(req.params.id), data));
  }));

  // ------------------------------------------------------------------ stock
  router.get('/stock', wrap(async (_req, res) => res.json(await repo.report('stock'))));
  router.get('/stock/low', wrap(async (req, res) => {
    const t = req.query.threshold !== undefined ? Number(req.query.threshold) : 20;
    if (!Number.isInteger(t) || t < 0) fail('Threshold must be a whole number of zero or more.');
    res.json(await repo.report('low_stock', String(t)));
  }));

  // -------------------------------------------------------------- purchases
  router.get('/purchases', wrap(async (_req, res) => res.json(await repo.report('purchases'))));
  router.post('/purchases', wrap(async (req, res) => {
    const data = validators.purchase(req.body);
    res.status(201).json(await repo.createPurchase(data));
  }));

  // ------------------------------------------------------------------ sales
  router.get('/sales', wrap(async (_req, res) => res.json(await repo.report('sales'))));
  router.post('/sales', wrap(async (req, res) => {
    const data = validators.sale(req.body);
    res.status(201).json(await repo.createSale(data));
  }));
  router.post('/sales/:id/payments', wrap(async (req, res) => {
    const data = validators.payment(req.body);
    res.status(201).json(await repo.addSalePayment(toId(req.params.id), data));
  }));

  // ---------------------------------------------------------------- reports
  router.get('/reports/summary', wrap(async (_req, res) => res.json(await repo.report('summary'))));
  router.get('/reports/top-fruits', wrap(async (_req, res) => res.json(await repo.report('top_fruits'))));
  router.get('/reports/top-vendor', wrap(async (_req, res) => res.json(await repo.report('top_vendor'))));
  router.get('/reports/stock', wrap(async (_req, res) => res.json(await repo.report('stock'))));
  router.get('/reports/revenue', wrap(async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!isDate(startDate) || !isDate(endDate)) fail('startDate and endDate must be YYYY-MM-DD.');
    if (startDate > endDate) fail('Start date must be on or before end date.');
    res.json(await repo.report('revenue', startDate, endDate));
  }));

  // ------------------------------------------------------- error handling
  router.use((_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

  // eslint-disable-next-line no-unused-vars
  router.use((err, _req, res, _next) => {
    const status = err.status ?? (err.sqlMessage || err.sql ? 400 : 500);
    let message = err.sqlMessage ?? err.message ?? 'Unexpected server error.';
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      message = 'Cannot reach the database. Check DB_HOST in your .env file — copy the exact Host from your Aiven service page.';
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      message = 'The database rejected the login. Check DB_USER and DB_PASSWORD in .env.';
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      message = 'The tables are missing. Run: npm run db:init';
    } else if (err.code === 'ECONNREFUSED') {
      message = 'The database refused the connection. Check DB_HOST and DB_PORT in .env.';
    }
    if (status >= 500) console.error('[api]', err);
    res.status(status).json({ error: message });
  });

  return { router, repo };
}
