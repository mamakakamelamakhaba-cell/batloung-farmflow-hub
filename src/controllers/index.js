// Controllers for the Batloung Farm Distribution System
import { createFarmRepository } from '../models/farm.model.js';
import { query, queryOne, transaction, ping } from '../database/connection.js';

const repo = createFarmRepository(query, queryOne, transaction);

// Wrap async route handlers
const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

// Supplier Controllers
export const supplierController = {
  list: wrap(async (req, res) => {
    const suppliers = await repo.suppliers.list();
    res.json(suppliers);
  }),

  get: wrap(async (req, res) => {
    const supplier = await repo.suppliers.get(Number(req.params.id));
    res.json(supplier);
  }),

  create: wrap(async (req, res) => {
    const supplier = await repo.suppliers.create(req.body);
    res.status(201).json(supplier);
  }),

  update: wrap(async (req, res) => {
    const supplier = await repo.suppliers.update(Number(req.params.id), req.body);
    res.json(supplier);
  }),

  delete: wrap(async (req, res) => {
    await repo.suppliers.remove(Number(req.params.id));
    res.status(204).end();
  }),
};

// Fruit Controllers
export const fruitController = {
  list: wrap(async (req, res) => {
    const fruits = await repo.fruits.list();
    res.json(fruits);
  }),

  get: wrap(async (req, res) => {
    const fruit = await repo.fruits.get(Number(req.params.id));
    res.json(fruit);
  }),

  create: wrap(async (req, res) => {
    const fruit = await repo.fruits.create(req.body);
    res.status(201).json(fruit);
  }),

  update: wrap(async (req, res) => {
    const fruit = await repo.fruits.update(Number(req.params.id), req.body);
    res.json(fruit);
  }),
};

// Vendor Controllers
export const vendorController = {
  list: wrap(async (req, res) => {
    const search = req.query.search;
    const vendors = await repo.vendors.list(search);
    res.json(vendors);
  }),

  get: wrap(async (req, res) => {
    const vendor = await repo.vendors.get(Number(req.params.id));
    res.json(vendor);
  }),

  create: wrap(async (req, res) => {
    const vendor = await repo.vendors.create(req.body);
    res.status(201).json(vendor);
  }),

  update: wrap(async (req, res) => {
    const vendor = await repo.vendors.update(Number(req.params.id), req.body);
    res.json(vendor);
  }),

  getBalances: wrap(async (req, res) => {
    const balances = await repo.report('balances');
    res.json(balances);
  }),
};

// Stock Controllers
export const stockController = {
  getAll: wrap(async (req, res) => {
    const stock = await repo.report('stock');
    res.json(stock);
  }),

  getLowStock: wrap(async (req, res) => {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 20;
    const lowStock = await repo.report('low_stock', threshold);
    res.json(lowStock);
  }),
};

// Purchase Controllers
export const purchaseController = {
  list: wrap(async (req, res) => {
    const purchases = await repo.report('purchases');
    res.json(purchases);
  }),

  create: wrap(async (req, res) => {
    const purchase = await repo.createPurchase(req.body);
    res.status(201).json(purchase);
  }),
};

// Sale Controllers
export const saleController = {
  list: wrap(async (req, res) => {
    const sales = await repo.report('sales');
    res.json(sales);
  }),

  create: wrap(async (req, res) => {
    const sale = await repo.createSale(req.body);
    res.status(201).json(sale);
  }),

  addPayment: wrap(async (req, res) => {
    const sale = await repo.addSalePayment(Number(req.params.id), req.body);
    res.status(201).json(sale);
  }),
};

// Report Controllers
export const reportController = {
  summary: wrap(async (req, res) => {
    const summary = await repo.report('summary');
    res.json(summary);
  }),

  topFruits: wrap(async (req, res) => {
    const topFruits = await repo.report('top_fruits');
    res.json(topFruits);
  }),

  topVendor: wrap(async (req, res) => {
    const topVendor = await repo.report('top_vendor');
    res.json(topVendor);
  }),

  stock: wrap(async (req, res) => {
    const stock = await repo.report('stock');
    res.json(stock);
  }),

  revenue: wrap(async (req, res) => {
    const { startDate, endDate } = req.query;
    const revenue = await repo.report('revenue', startDate, endDate);
    res.json(revenue);
  }),

  activity: wrap(async (req, res) => {
    const activity = await repo.report('activity');
    res.json(activity);
  }),
};

// Health Check
export const healthController = {
  check: wrap(async (req, res) => {
    const info = await ping();
    res.json({ status: 'ok', database: info.database, mysql: info.version, records: info.counts });
  }),
};