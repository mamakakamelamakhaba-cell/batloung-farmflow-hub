// API Routes for the Batloung Farm Distribution System
import express from 'express';
import authRouter from './auth.js';
import emailRouter from './email.js';
import {
  supplierController,
  fruitController,
  vendorController,
  stockController,
  purchaseController,
  saleController,
  reportController,
  healthController,
} from '../controllers/index.js';
import { createFarmRepository } from '../models/farm.model.js';
import { query, queryOne, transaction } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Create repo instance for internal use
const repo = createFarmRepository(query, queryOne, transaction);

// Validation middleware
const validateId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid record ID.' });
  }
  req.params.id = id;
  next();
};

// Auth routes (public)
router.use('/auth', authRouter);

// Email routes
router.use('/email', emailRouter);

// Health Check (public)
router.get('/health', healthController.check);

// Protected routes - require authentication
router.use(authenticateToken);

// Supplier Routes
router.get('/suppliers', supplierController.list);
router.get('/suppliers/:id', validateId, supplierController.get);
router.post('/suppliers', requireRole('ADMIN'), supplierController.create);
router.put('/suppliers/:id', validateId, requireRole('ADMIN'), supplierController.update);
router.delete('/suppliers/:id', validateId, requireRole('ADMIN'), supplierController.delete);

// Fruit Routes
router.get('/fruits', fruitController.list);
router.get('/fruits/:id', validateId, fruitController.get);
router.post('/fruits', requireRole('ADMIN'), fruitController.create);
router.put('/fruits/:id', validateId, requireRole('ADMIN'), fruitController.update);

// Vendor Routes
router.get('/vendors', vendorController.list);
router.get('/vendors/balances', vendorController.getBalances);
router.get('/vendors/:id', validateId, vendorController.get);
router.post('/vendors', requireRole('ADMIN'), vendorController.create);
router.put('/vendors/:id', validateId, requireRole('ADMIN'), vendorController.update);

// Stock Routes
router.get('/stock', stockController.getAll);
router.get('/stock/low', stockController.getLowStock);

// Purchase Routes
router.get('/purchases', purchaseController.list);
router.post('/purchases', requireRole('ADMIN'), purchaseController.create);

// Sale Routes
router.get('/sales', saleController.list);
router.post('/sales', requireRole('ADMIN'), saleController.create);
router.post('/sales/:id/payments', validateId, requireRole('ADMIN'), saleController.addPayment);

// Report Routes
router.get('/reports/summary', reportController.summary);
router.get('/reports/top-fruits', reportController.topFruits);
router.get('/reports/top-vendor', reportController.topVendor);
router.get('/reports/stock', reportController.stock);
router.get('/reports/revenue', reportController.revenue);
router.get('/reports/activity', reportController.activity);

// Dashboard
router.get('/dashboard/summary', reportController.summary);
router.get('/dashboard/activity', reportController.activity);

// Vendor-specific routes (vendors can see their own data)
router.get('/vendor/profile', async (req, res) => {
  if (req.user.role !== 'VENDOR' || !req.user.vendor_id) {
    return res.status(403).json({ error: 'Vendor access required' });
  }
  const vendor = await repo.vendors.get(req.user.vendor_id);
  const balances = await repo.report('balances');
  const balance = balances.find(b => b.id === req.user.vendor_id);
  res.json({ vendor, balance });
});

router.get('/vendor/sales', async (req, res) => {
  if (req.user.role !== 'VENDOR' || !req.user.vendor_id) {
    return res.status(403).json({ error: 'Vendor access required' });
  }
  const sales = await repo.report('sales');
  const vendorSales = sales.filter(s => s.vendorId === req.user.vendor_id);
  res.json(vendorSales);
});

router.get('/vendor/balance', async (req, res) => {
  if (req.user.role !== 'VENDOR' || !req.user.vendor_id) {
    return res.status(403).json({ error: 'Vendor access required' });
  }
  const balances = await repo.report('balances');
  const vendorBalance = balances.find(b => b.id === req.user.vendor_id);
  res.json(vendorBalance || { outstandingBalance: 0 });
});

// Detailed report endpoints
router.get('/reports/fruit/:id/history', validateId, async (req, res) => {
  const result = await repo.fruitHistory(req.params.id);
  if (!result) return res.status(404).json({ error: 'Fruit not found' });
  res.json(result);
});

router.get('/reports/vendor/:id/history', validateId, async (req, res) => {
  const result = await repo.vendorHistory(req.params.id);
  if (!result) return res.status(404).json({ error: 'Vendor not found' });
  res.json(result);
});

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

export default router;