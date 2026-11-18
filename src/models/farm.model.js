// PostgreSQL data access for the Batloung Farm Distribution System.
// Implements every operation the UI calls (see src/lib/api.ts).

const sizeList = ['SMALL', 'MEDIUM', 'LARGE'];
const num = (v) => Number(v ?? 0);

const SUPPLIER_COLS = `id, business_name AS businessName, contact_person AS contactPerson,
                       phone, province, address`;
const FRUIT_COLS = `id, name, description, status,
                    small_price AS smallPrice, medium_price AS mediumPrice,
                    large_price AS largePrice`;
const VENDOR_COLS = `id, name, phone, location, registration_date AS registrationDate`;

/** Convert snake_case object keys to camelCase (PostgreSQL returns lowercase). */
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = toCamel(v);
  }
  return out;
}

const mapFruit = (f) => f && {
  ...f,
  smallPrice: num(f.smallPrice),
  mediumPrice: num(f.mediumPrice),
  largePrice: num(f.largePrice),
};

/** Convert MySQL error codes to PostgreSQL error codes. */
function friendly(err) {
  if (err && (err.code === '23505' || err.code === 'ER_DUP_ENTRY')) {
    throw Object.assign(new Error('A record with these details already exists.'), { status: 409 });
  }
  if (err && (err.code === '23503' || err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED')) {
    throw Object.assign(new Error('This record is linked to other records and cannot be removed.'), { status: 409 });
  }
  throw err;
}

async function safe(fn) {
  try { return await fn(); } catch (e) { friendly(e); }
}

export function createFarmRepository(query, queryOne, transaction) {
  // ------------------------------------------------------------------ reports
  async function report(kind, a = null, b = null) {
    switch (kind) {
      case 'summary': {
        const row = await queryOne(`
          SELECT
            (SELECT COALESCE(SUM(available_quantity),0) FROM stock) AS totalStockBoxes,
            (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE sale_date = CURRENT_DATE) AS todaysSales,
            (SELECT COALESCE(SUM(total_amount - paid_amount),0) FROM sales) AS outstandingBalance,
            (SELECT COUNT(*) FROM vendors) AS activeVendors,
            (SELECT COUNT(*) FROM stock WHERE available_quantity <= low_stock_threshold) AS lowStockCount`);
        return {
          totalStockBoxes: num(row.totalStockBoxes),
          todaysSales: num(row.todaysSales),
          outstandingBalance: num(row.outstandingBalance),
          activeVendors: num(row.activeVendors),
          lowStockCount: num(row.lowStockCount),
        };
      }

      case 'activity': {
        const rows = await query(`
          SELECT * FROM (
            SELECT CONCAT('P-', p.id) AS id, 'PURCHASE' AS type, 'Supplier purchase' AS title,
                   s.business_name AS description, p.total_amount AS amount, p.purchase_date AS date
            FROM purchases p JOIN suppliers s ON s.id = p.supplier_id
            UNION ALL
            SELECT CONCAT('S-', s.id), 'SALE', 'Vendor sale', v.name,
                   s.total_amount, s.sale_date
            FROM sales s JOIN vendors v ON v.id = s.vendor_id
          ) u
          ORDER BY date DESC, id DESC
          LIMIT 10`);
        return toCamel(rows.map((r) => ({ ...r, amount: num(r.amount) })));
      }

      case 'top_fruits': {
        const rows = await query(`
          SELECT f.id AS fruitId, f.name AS fruitName, SUM(sd.quantity) AS boxesSold
          FROM fruits f JOIN sale_details sd ON sd.fruit_id = f.id
          GROUP BY f.id, f.name
          ORDER BY boxesSold DESC, f.name
          LIMIT 5`);
        return toCamel(rows.map((r) => ({ ...r, boxesSold: num(r.boxesSold) })));
      }

      case 'top_vendor': {
        const row = await queryOne(`
          SELECT v.id AS vendorId, v.name AS vendorName, COALESCE(SUM(sd.quantity),0) AS boxesPurchased
          FROM vendors v
          LEFT JOIN sales s ON s.vendor_id = v.id
          LEFT JOIN sale_details sd ON sd.sale_id = s.id
          GROUP BY v.id, v.name
          ORDER BY boxesPurchased DESC, v.name
          LIMIT 1`);
        return row
          ? toCamel({ ...row, boxesPurchased: num(row.boxesPurchased) })
          : { vendorId: null, vendorName: null, boxesPurchased: 0 };
      }

      case 'stock': {
        const rows = await query(`
          SELECT f.id AS fruitId, f.name AS fruitName, s.packaging_size AS packagingSize,
                 s.available_quantity AS quantity, s.low_stock_threshold AS threshold
          FROM stock s JOIN fruits f ON f.id = s.fruit_id
          ORDER BY f.name, 
            CASE s.packaging_size WHEN 'SMALL' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LARGE' THEN 3 END`);
        return toCamel(rows.map((r) => ({ ...r, quantity: num(r.quantity), threshold: num(r.threshold) })));
      }

      case 'balances': {
        const rows = await query(`
          SELECT v.id, v.name, v.phone,
                 COALESCE(SUM(s.total_amount),0) AS totalPurchased,
                 COALESCE(SUM(s.paid_amount),0)  AS totalPaid,
                 COALESCE(SUM(s.total_amount),0) - COALESCE(SUM(s.paid_amount),0) AS outstandingBalance
          FROM vendors v LEFT JOIN sales s ON s.vendor_id = v.id
          GROUP BY v.id, v.name, v.phone
          ORDER BY v.name`);
        return toCamel(rows.map((r) => ({ ...r, totalPurchased: num(r.totalPurchased), totalPaid: num(r.totalPaid), outstandingBalance: num(r.outstandingBalance) })));
      }

      case 'purchases': {
        const rows = await query(`
          SELECT p.id, p.supplier_id AS supplierId, s.business_name AS supplierName,
                 p.purchase_date AS purchaseDate, p.total_amount AS totalAmount,
                 (SELECT COUNT(*) FROM purchase_details d WHERE d.purchase_id = p.id) AS itemCount
          FROM purchases p JOIN suppliers s ON s.id = p.supplier_id
          ORDER BY p.purchase_date DESC, p.id DESC`);
        return toCamel(rows.map((r) => ({ ...r, totalAmount: num(r.totalAmount), itemCount: num(r.itemCount) })));
      }

      case 'sales': {
        const rows = await query(`
          SELECT s.id, s.vendor_id AS vendorId, v.name AS vendorName, s.sale_date AS saleDate,
                 s.payment_method AS paymentMethod, s.payment_status AS paymentStatus,
                 s.total_amount AS totalAmount, s.paid_amount AS paidAmount,
                 (SELECT COUNT(*) FROM sale_details d WHERE d.sale_id = s.id) AS itemCount
          FROM sales s JOIN vendors v ON v.id = s.vendor_id
          ORDER BY s.sale_date DESC, s.id DESC`);
        return toCamel(rows.map((r) => ({ ...r, totalAmount: num(r.totalAmount), paidAmount: num(r.paidAmount), itemCount: num(r.itemCount) })));
      }

      case 'low_stock': {
        const threshold = num(a ?? 20);
        const rows = await query(`
          SELECT f.id AS fruitId, f.name AS fruitName, s.packaging_size AS packagingSize,
                 s.available_quantity AS quantity, ? AS threshold
          FROM stock s JOIN fruits f ON f.id = s.fruit_id
          WHERE s.available_quantity <= ?
          ORDER BY s.available_quantity, f.name`, [threshold, threshold]);
        return toCamel(rows.map((r) => ({ ...r, quantity: num(r.quantity), threshold })));
      }

      case 'revenue': {
        const row = await queryOne(
          'SELECT COALESCE(SUM(total_amount),0) AS revenue FROM sales WHERE sale_date BETWEEN $1 AND $2',
          [a, b]);
        return { startDate: a, endDate: b, revenue: num(row.revenue) };
      }

      default:
        throw Object.assign(new Error('Unknown report'), { status: 400 });
    }
  }

  // ---------------------------------------------------------------- suppliers
  const suppliers = {
    list: () => query(`SELECT ${SUPPLIER_COLS} FROM suppliers ORDER BY business_name`),
    get: async (id) => {
      const row = await queryOne(`SELECT ${SUPPLIER_COLS} FROM suppliers WHERE id = $1`, [id]);
      if (!row) throw Object.assign(new Error('Supplier not found.'), { status: 404 });
      return row;
    },
    create: (d) => safe(async () => {
      const r = await query(
        `INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [d.businessName, d.contactPerson, d.phone, d.province, d.address]);
      return suppliers.get(r.rows[0].id);
    }),
    update: (id, d) => safe(async () => {
      const map = { businessName: 'business_name', contactPerson: 'contact_person' };
      const fields = []; const params = [];
      let paramIndex = 1;
      for (const [k, v] of Object.entries(d)) {
        if (v === undefined) continue;
        fields.push(`${map[k] ?? k} = $${paramIndex++}`); params.push(v);
      }
      if (fields.length) {
        params.push(id);
        await query(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
      }
      return suppliers.get(id);
    }),
    remove: (id) => safe(async () => {
      const r = await query('DELETE FROM suppliers WHERE id = $1', [id]);
      if (!r.rowCount) throw Object.assign(new Error('Supplier not found.'), { status: 404 });
      return null;
    }),
  };

  // ------------------------------------------------------------------- fruits
  const fruits = {
    list: async () => (await query(`SELECT ${FRUIT_COLS} FROM fruits ORDER BY name`)).map(mapFruit),
    get: async (id) => {
      const row = await queryOne(`SELECT ${FRUIT_COLS} FROM fruits WHERE id = $1`, [id]);
      if (!row) throw Object.assign(new Error('Fruit not found.'), { status: 404 });
      return mapFruit(row);
    },
    create: (d) => safe(async () => {
      const fruitId = await transaction(async ({ query }) => {
        const r = await query(
          'INSERT INTO fruits (name, description, status, small_price, medium_price, large_price) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [d.name, d.description ?? '', d.status ?? 'ACTIVE', d.smallPrice ?? 0, d.mediumPrice ?? 0, d.largePrice ?? 0]
        );
        const id = r.rows[0].id;
        await query(
          'INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES ($1,$2,0),($1,$3,0),($1,$4,0)',
          [id, 'SMALL', 'MEDIUM', 'LARGE']
        );
        return id;
      });
      return fruits.get(fruitId);
    }),
    update: (id, d) => safe(async () => {
      const map = { smallPrice: 'small_price', mediumPrice: 'medium_price', largePrice: 'large_price' };
      const fields = []; const params = [];
      let paramIndex = 1;
      for (const [k, v] of Object.entries(d)) {
        if (v === undefined) continue;
        fields.push(`${map[k] ?? k} = $${paramIndex++}`); params.push(v);
      }
      if (fields.length) {
        params.push(id);
        await query(`UPDATE fruits SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
      }
      return fruits.get(id);
    }),
  };

  // ------------------------------------------------------------------ vendors
  const vendors = {
    list: (search) => {
      if (!search) return query(`SELECT ${VENDOR_COLS} FROM vendors ORDER BY name`);
      const s = `%${String(search).replace(/[%_\\]/g, '')}%`;
      return query(`SELECT ${VENDOR_COLS} FROM vendors WHERE name LIKE $1 OR phone LIKE $1 ORDER BY name`, [s]);
    },
    get: async (id) => {
      const row = await queryOne(`SELECT ${VENDOR_COLS} FROM vendors WHERE id = $1`, [id]);
      if (!row) throw Object.assign(new Error('Vendor not found.'), { status: 404 });
      return row;
    },
    create: (d) => safe(async () => {
      const r = await query(
        'INSERT INTO vendors (name, phone, location, registration_date) VALUES ($1,$2,$3,$4) RETURNING id',
        [d.name, d.phone, d.location, d.registrationDate]);
      return vendors.get(r.rows[0].id);
    }),
    update: (id, d) => safe(async () => {
      const map = { registrationDate: 'registration_date' };
      const fields = []; const params = [];
      let paramIndex = 1;
      for (const [k, v] of Object.entries(d)) {
        if (v === undefined) continue;
        fields.push(`${map[k] ?? k} = $${paramIndex++}`); params.push(v);
      }
      if (fields.length) {
        params.push(id);
        await query(`UPDATE vendors SET ${fields.join(', ')} WHERE id = $${paramIndex}`, params);
      }
      return vendors.get(id);
    }),
  };

  // --------------------------------------------------- purchases, sales, money
  async function createPurchase(d) {
    return safe(async () => {
      const id = await transaction(async ({ query, queryOne }) => {
        // Validate supplier exists
        const supplier = await queryOne('SELECT id FROM suppliers WHERE id = $1 FOR UPDATE', [d.supplierId]);
        if (!supplier) throw Object.assign(new Error('Supplier not found.'), { status: 404 });

        const items = d.items;
        if (!items.length) throw Object.assign(new Error('Add at least one item.'), { status: 400 });

        let v_total = 0;
        for (const it of items) {
          if (!Number.isInteger(it.quantity) || it.quantity < 1) {
            throw Object.assign(new Error('Every item needs a whole number of boxes above zero.'), { status: 400 });
          }
          if (typeof it.unitCost !== 'number' || it.unitCost <= 0) {
            throw Object.assign(new Error('Every item needs a unit cost above zero.'), { status: 400 });
          }
          if (!['SMALL', 'MEDIUM', 'LARGE'].includes(it.packagingSize)) {
            throw Object.assign(new Error('Invalid packaging size.'), { status: 400 });
          }
          const fruit = await queryOne('SELECT id FROM fruits WHERE id = $1', [it.fruitId]);
          if (!fruit) throw Object.assign(new Error('One or more selected fruits do not exist.'), { status: 404 });

          v_total += it.quantity * it.unitCost;
        }

        const result = await query(
          'INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES ($1,$2,$3) RETURNING id',
          [d.supplierId, d.purchaseDate, v_total]
        );
        const purchaseId = result.rows[0].id;

        for (const it of items) {
          await query(
            'INSERT INTO purchase_details (purchase_id, fruit_id, packaging_size, quantity, unit_cost) VALUES ($1,$2,$3,$4,$5)',
            [purchaseId, it.fruitId, it.packagingSize, it.quantity, it.unitCost]
          );

          await query(
            `INSERT INTO stock (fruit_id, packaging_size, available_quantity) VALUES ($1,$2,$3)
             ON CONFLICT (fruit_id, packaging_size) DO UPDATE SET available_quantity = stock.available_quantity + EXCLUDED.available_quantity`,
            [it.fruitId, it.packagingSize, it.quantity]
          );
        }

        return purchaseId;
      });
      const rows = await report('purchases');
      return rows.find((r) => Number(r.id) === Number(id)) ?? null;
    });
  }

  async function saleById(id) {
    const rows = await report('sales');
    return rows.find((r) => Number(r.id) === Number(id)) ?? null;
  }

  async function createSale(d) {
    return safe(async () => {
      const id = await transaction(async ({ query, queryOne }) => {
        // Validate vendor exists
        const vendor = await queryOne('SELECT id FROM vendors WHERE id = $1 FOR UPDATE', [d.vendorId]);
        if (!vendor) throw Object.assign(new Error('Vendor not found.'), { status: 404 });

        if (!['CASH', 'MOBILE_MONEY', 'CREDIT'].includes(d.paymentMethod)) {
          throw Object.assign(new Error('Choose cash, mobile money or credit.'), { status: 400 });
        }

        const items = d.items;
        if (!items.length) throw Object.assign(new Error('Add at least one item.'), { status: 400 });

        let v_total = 0;
        // Pass 1: validate everything and lock stock rows
        for (const it of items) {
          if (!Number.isInteger(it.quantity) || it.quantity < 1) {
            throw Object.assign(new Error('Every item needs a whole number of boxes above zero.'), { status: 400 });
          }
          if (!['SMALL', 'MEDIUM', 'LARGE'].includes(it.packagingSize)) {
            throw Object.assign(new Error('Invalid packaging size.'), { status: 400 });
          }

          const fruit = await queryOne(
            'SELECT name, status, small_price, medium_price, large_price FROM fruits WHERE id = $1',
            [it.fruitId]
          );
          if (!fruit) throw Object.assign(new Error('One or more selected fruits do not exist.'), { status: 404 });
          if (fruit.status !== 'ACTIVE') {
            throw Object.assign(new Error(`${fruit.name} is not currently available for sale.`), { status: 400 });
          }

          const price = fruit[`${it.packagingSize.toLowerCase()}_price`];
          if (price <= 0) {
            throw Object.assign(new Error(`Set a selling price for ${fruit.name} ${it.packagingSize.toLowerCase()} boxes before recording a sale.`), { status: 400 });
          }

          const stock = await queryOne(
            'SELECT available_quantity FROM stock WHERE fruit_id = $1 AND packaging_size = $2 FOR UPDATE',
            [it.fruitId, it.packagingSize]
          );
          if (!stock || stock.available_quantity < it.quantity) {
            const avail = stock?.available_quantity ?? 0;
            throw Object.assign(
              new Error(`Not enough ${it.packagingSize.toLowerCase()} boxes of ${fruit.name}. Available: ${avail}; requested: ${it.quantity}. No stock was changed.`),
              { status: 400 }
            );
          }

          v_total += it.quantity * price;
        }

        v_total = Math.round(v_total * 100) / 100;
        const v_paid = d.paidAmount ?? (d.paymentMethod === 'CREDIT' ? 0 : v_total);

        if (v_paid > v_total) {
          throw Object.assign(new Error('The payment cannot exceed the sale total.'), { status: 400 });
        }
        if (d.paymentMethod === 'CREDIT' && v_paid > 0) {
          throw Object.assign(new Error('Choose cash or mobile money when recording an initial payment.'), { status: 400 });
        }

        const paymentStatus = v_paid >= v_total ? 'PAID' : v_paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

        const result = await query(
          'INSERT INTO sales (vendor_id, sale_date, payment_method, payment_status, total_amount, paid_amount) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [d.vendorId, d.saleDate, d.paymentMethod, paymentStatus, v_total, v_paid]
        );
        const saleId = result.rows[0].id;

        // Pass 2: write detail lines and take stock
        for (const it of items) {
          const fruit = await queryOne(
            'SELECT small_price, medium_price, large_price FROM fruits WHERE id = $1',
            [it.fruitId]
          );
          const price = fruit[`${it.packagingSize.toLowerCase()}_price`];

          await query(
            'INSERT INTO sale_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES ($1,$2,$3,$4,$5)',
            [saleId, it.fruitId, it.packagingSize, it.quantity, price]
          );

          await query(
            'UPDATE stock SET available_quantity = available_quantity - $1 WHERE fruit_id = $2 AND packaging_size = $3',
            [it.quantity, it.fruitId, it.packagingSize]
          );
        }

        if (v_paid > 0 && d.paymentMethod !== 'CREDIT') {
          await query(
            'INSERT INTO payments (sale_id, payment_method, amount, payment_date) VALUES ($1,$2,$3,$4)',
            [saleId, d.paymentMethod, v_paid, d.saleDate]
          );
        }

        return saleId;
      });
      return saleById(id);
    });
  }

  async function addSalePayment(id, d) {
    return safe(async () => {
      await transaction(async ({ query, queryOne }) => {
        if (typeof d.amount !== 'number' || d.amount <= 0) {
          throw Object.assign(new Error('Enter a payment amount above zero.'), { status: 400 });
        }
        if (!['CASH', 'MOBILE_MONEY'].includes(d.paymentMethod)) {
          throw Object.assign(new Error('Choose cash or mobile money.'), { status: 400 });
        }

        const sale = await queryOne('SELECT total_amount, paid_amount FROM sales WHERE id = $1 FOR UPDATE', [id]);
        if (!sale) throw Object.assign(new Error('Sale not found.'), { status: 404 });

        const v_new = Math.round((sale.paid_amount + d.amount) * 100) / 100;
        if (v_new > sale.total_amount) {
          throw Object.assign(new Error(`Payment exceeds the outstanding balance of ${(sale.total_amount - sale.paid_amount).toFixed(2)}.`), { status: 400 });
        }

        await query(
          'INSERT INTO payments (sale_id, payment_method, amount, payment_date) VALUES ($1,$2,$3,CURRENT_DATE)',
          [id, d.paymentMethod, d.amount]
        );

        const paymentStatus = v_new >= sale.total_amount ? 'PAID' : v_new > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
        await query(
          'UPDATE sales SET paid_amount = $1, payment_status = $2 WHERE id = $3',
          [v_new, paymentStatus, id]
        );
      });
      const sale = await saleById(id);
      if (!sale) throw Object.assign(new Error('Sale not found.'), { status: 404 });
      return sale;
    });
  }

  async function fruitHistory(fruitId) {
    return safe(async () => {
      const fruit = await fruits.get(fruitId);
      if (!fruit) throw Object.assign(new Error('Fruit not found'), { status: 404 });

      const purchases = await query(`
        SELECT pd.id, p.purchase_date, s.business_name as supplier, pd.packaging_size, pd.quantity, pd.unit_cost,
               (pd.quantity * pd.unit_cost) as line_total
        FROM purchase_details pd
        JOIN purchases p ON pd.purchase_id = p.id
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE pd.fruit_id = $1
        ORDER BY p.purchase_date DESC
      `, [fruitId]);

      const sales = await query(`
        SELECT sd.id, s.sale_date, v.name as vendor, sd.packaging_size, sd.quantity, sd.unit_price,
               (sd.quantity * sd.unit_price) as line_total
        FROM sale_details sd
        JOIN sales s ON sd.sale_id = s.id
        JOIN vendors v ON s.vendor_id = v.id
        WHERE sd.fruit_id = $1
        ORDER BY s.sale_date DESC
      `, [fruitId]);

      const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
      const totalPurchaseValue = purchases.reduce((sum, p) => sum + p.line_total, 0);
      const totalSaleValue = sales.reduce((sum, s) => sum + s.line_total, 0);

      return {
        fruit,
        summary: {
          totalPurchased,
          totalSold,
          totalPurchaseValue,
          totalSaleValue,
          grossProfit: totalSaleValue - totalPurchaseValue,
        },
        purchases: toCamel(purchases),
        sales: toCamel(sales),
      };
    });
  }

  async function vendorHistory(vendorId) {
    return safe(async () => {
      const vendor = await vendors.get(vendorId);
      if (!vendor) throw Object.assign(new Error('Vendor not found'), { status: 404 });

      const sales = await query(`
        SELECT s.id, s.sale_date, s.payment_method, s.payment_status, s.total_amount, s.paid_amount,
               (s.total_amount - s.paid_amount) as outstanding
        FROM sales s
        WHERE s.vendor_id = $1
        ORDER BY s.sale_date DESC
      `, [vendorId]);

      const saleDetails = await query(`
        SELECT sd.*, f.name as fruit_name, s.sale_date
        FROM sale_details sd
        JOIN sales s ON sd.sale_id = s.id
        JOIN fruits f ON sd.fruit_id = f.id
        WHERE s.vendor_id = $1
        ORDER BY s.sale_date DESC
      `, [vendorId]);

      const payments = await query(`
        SELECT p.*, s.id as sale_id
        FROM payments p
        JOIN sales s ON p.sale_id = s.id
        WHERE s.vendor_id = $1
        ORDER BY p.payment_date DESC
      `, [vendorId]);

      const totalPurchases = sales.length;
      const totalAmount = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const totalPaid = sales.reduce((sum, s) => sum + Number(s.paid_amount), 0);
      const totalOutstanding = totalAmount - totalPaid;

      return {
        vendor,
        summary: {
          totalPurchases,
          totalAmount,
          totalPaid,
          totalOutstanding,
        },
        sales: toCamel(sales),
        saleDetails: toCamel(saleDetails),
        payments: toCamel(payments),
      };
    });
  }

  return { report, suppliers, fruits, vendors, createPurchase, createSale, addSalePayment, saleById, fruitHistory, vendorHistory };
}