// MySQL data access for the Batloung Farm Distribution System.
// Implements every operation the UI calls (see src/lib/api.ts).
// Business rules that must be atomic live in the database stored procedures.

const sizeList = ['SMALL', 'MEDIUM', 'LARGE'];
const num = (v) => Number(v ?? 0);

const SUPPLIER_COLS = `id, business_name AS businessName, contact_person AS contactPerson,
                       phone, province, address`;
const FRUIT_COLS = `id, name, description, status,
                    small_price AS smallPrice, medium_price AS mediumPrice,
                    large_price AS largePrice`;
const VENDOR_COLS = `id, name, phone, location, registration_date AS registrationDate`;

const mapFruit = (f) => f && {
  ...f,
  smallPrice: num(f.smallPrice),
  mediumPrice: num(f.mediumPrice),
  largePrice: num(f.largePrice),
};

export function createFarmRepository(query, queryOne, transaction) {
  /** Throw a friendly message for constraint violations. */
  function friendly(err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw Object.assign(new Error('A record with these details already exists.'), { status: 409 });
    }
    if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED')) {
      throw Object.assign(new Error('This record is linked to other records and cannot be removed.'), { status: 409 });
    }
    throw err;
  }

  async function safe(fn) {
    try { return await fn(); } catch (e) { friendly(e); }
  }

  // ------------------------------------------------------------------ reports
  async function report(kind, a = null, b = null) {
    switch (kind) {
      case 'summary': {
        const row = await queryOne(`
          SELECT
            (SELECT COALESCE(SUM(available_quantity),0) FROM stock) AS totalStockBoxes,
            (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE sale_date = CURDATE()) AS todaysSales,
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
        return rows.map((r) => ({ ...r, amount: num(r.amount) }));
      }

      case 'top_fruits': {
        const rows = await query(`
          SELECT f.id AS fruitId, f.name AS fruitName, SUM(sd.quantity) AS boxesSold
          FROM fruits f JOIN sale_details sd ON sd.fruit_id = f.id
          GROUP BY f.id, f.name
          ORDER BY boxesSold DESC, f.name
          LIMIT 5`);
        return rows.map((r) => ({ ...r, boxesSold: num(r.boxesSold) }));
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
          ? { ...row, boxesPurchased: num(row.boxesPurchased) }
          : { vendorId: null, vendorName: null, boxesPurchased: 0 };
      }

      case 'stock': {
        const rows = await query(`
          SELECT f.id AS fruitId, f.name AS fruitName, s.packaging_size AS packagingSize,
                 s.available_quantity AS quantity, s.low_stock_threshold AS threshold
          FROM stock s JOIN fruits f ON f.id = s.fruit_id
          ORDER BY f.name, FIELD(s.packaging_size,'SMALL','MEDIUM','LARGE')`);
        return rows.map((r) => ({ ...r, quantity: num(r.quantity), threshold: num(r.threshold) }));
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
        return rows.map((r) => ({ ...r, totalPurchased: num(r.totalPurchased), totalPaid: num(r.totalPaid), outstandingBalance: num(r.outstandingBalance) }));
      }

      case 'purchases': {
        const rows = await query(`
          SELECT p.id, p.supplier_id AS supplierId, s.business_name AS supplierName,
                 p.purchase_date AS purchaseDate, p.total_amount AS totalAmount,
                 (SELECT COUNT(*) FROM purchase_details d WHERE d.purchase_id = p.id) AS itemCount
          FROM purchases p JOIN suppliers s ON s.id = p.supplier_id
          ORDER BY p.purchase_date DESC, p.id DESC`);
        return rows.map((r) => ({ ...r, totalAmount: num(r.totalAmount), itemCount: num(r.itemCount) }));
      }

      case 'sales': {
        const rows = await query(`
          SELECT s.id, s.vendor_id AS vendorId, v.name AS vendorName, s.sale_date AS saleDate,
                 s.payment_method AS paymentMethod, s.payment_status AS paymentStatus,
                 s.total_amount AS totalAmount, s.paid_amount AS paidAmount,
                 (SELECT COUNT(*) FROM sale_details d WHERE d.sale_id = s.id) AS itemCount
          FROM sales s JOIN vendors v ON v.id = s.vendor_id
          ORDER BY s.sale_date DESC, s.id DESC`);
        return rows.map((r) => ({ ...r, totalAmount: num(r.totalAmount), paidAmount: num(r.paidAmount), itemCount: num(r.itemCount) }));
      }

      case 'low_stock': {
        const threshold = num(a ?? 20);
        const rows = await query(`
          SELECT f.id AS fruitId, f.name AS fruitName, s.packaging_size AS packagingSize,
                 s.available_quantity AS quantity, ? AS threshold
          FROM stock s JOIN fruits f ON f.id = s.fruit_id
          WHERE s.available_quantity <= ?
          ORDER BY s.available_quantity, f.name`, [threshold, threshold]);
        return rows.map((r) => ({ ...r, quantity: num(r.quantity), threshold }));
      }

      case 'revenue': {
        const row = await queryOne(
          'SELECT COALESCE(SUM(total_amount),0) AS revenue FROM sales WHERE sale_date BETWEEN ? AND ?',
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
      const row = await queryOne(`SELECT ${SUPPLIER_COLS} FROM suppliers WHERE id = ?`, [id]);
      if (!row) throw Object.assign(new Error('Supplier not found.'), { status: 404 });
      return row;
    },
    create: (d) => safe(async () => {
      const r = await query(
        `INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES (?,?,?,?,?)`,
        [d.businessName, d.contactPerson, d.phone, d.province, d.address]);
      return suppliers.get(r.insertId);
    }),
    update: (id, d) => safe(async () => {
      const map = { businessName: 'business_name', contactPerson: 'contact_person' };
      const fields = []; const params = [];
      for (const [k, v] of Object.entries(d)) {
        if (v === undefined) continue;
        fields.push(`${map[k] ?? k} = ?`); params.push(v);
      }
      if (fields.length) await query(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
      return suppliers.get(id);
    }),
    remove: (id) => safe(async () => {
      const r = await query('DELETE FROM suppliers WHERE id = ?', [id]);
      if (!r.affectedRows) throw Object.assign(new Error('Supplier not found.'), { status: 404 });
      return null;
    }),
  };

  // ------------------------------------------------------------------- fruits
  const fruits = {
    list: async () => (await query(`SELECT ${FRUIT_COLS} FROM fruits ORDER BY name`)).map(mapFruit),
    get: async (id) => {
      const row = await queryOne(`SELECT ${FRUIT_COLS} FROM fruits WHERE id = ?`, [id]);
      if (!row) throw Object.assign(new Error('Fruit not found.'), { status: 404 });
      return mapFruit(row);
    },
    create: (d) => safe(async () => {
      const conn = await transaction(async (c) => {
        const [r] = await c.query('CALL bf_create_fruit(?,?,?,?,?,?, @new_id)',
          [d.name, d.description ?? '', d.status ?? 'ACTIVE', d.smallPrice ?? 0, d.mediumPrice ?? 0, d.largePrice ?? 0]);
        const [[out]] = await c.query('SELECT @new_id AS id');
        return out.id;
      });
      return fruits.get(conn);
    }),
    update: (id, d) => safe(async () => {
      const map = { smallPrice: 'small_price', mediumPrice: 'medium_price', largePrice: 'large_price' };
      const fields = []; const params = [];
      for (const [k, v] of Object.entries(d)) {
        if (v === undefined) continue;
        fields.push(`${map[k] ?? k} = ?`); params.push(v);
      }
      if (fields.length) await query(`UPDATE fruits SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
      return fruits.get(id);
    }),
  };

  // ------------------------------------------------------------------ vendors
  const vendors = {
    list: (search) => {
      if (!search) return query(`SELECT ${VENDOR_COLS} FROM vendors ORDER BY name`);
      const s = `%${String(search).replace(/[%_\\]/g, '')}%`;
      return query(`SELECT ${VENDOR_COLS} FROM vendors WHERE name LIKE ? OR phone LIKE ? ORDER BY name`, [s, s]);
    },
    get: async (id) => {
      const row = await queryOne(`SELECT ${VENDOR_COLS} FROM vendors WHERE id = ?`, [id]);
      if (!row) throw Object.assign(new Error('Vendor not found.'), { status: 404 });
      return row;
    },
    create: (d) => safe(async () => {
      const r = await query(
        'INSERT INTO vendors (name, phone, location, registration_date) VALUES (?,?,?,?)',
        [d.name, d.phone, d.location, d.registrationDate]);
      return vendors.get(r.insertId);
    }),
    update: (id, d) => safe(async () => {
      const map = { registrationDate: 'registration_date' };
      const fields = []; const params = [];
      for (const [k, v] of Object.entries(d)) {
        if (v === undefined) continue;
        fields.push(`${map[k] ?? k} = ?`); params.push(v);
      }
      if (fields.length) await query(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
      return vendors.get(id);
    }),
  };

  // --------------------------------------------------- purchases, sales, money
  async function createPurchase(d) {
    return safe(async () => {
      const id = await transaction(async (c) => {
        await c.query('CALL bf_create_purchase(?,?,?, @new_id)', [d.supplierId, d.purchaseDate, JSON.stringify(d.items)]);
        const [[out]] = await c.query('SELECT @new_id AS id');
        return out.id;
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
      const id = await transaction(async (c) => {
        await c.query('CALL bf_create_sale(?,?,?,?,?, @new_id)',
          [d.vendorId, d.saleDate, d.paymentMethod, d.paidAmount ?? null, JSON.stringify(d.items)]);
        const [[out]] = await c.query('SELECT @new_id AS id');
        return out.id;
      });
      return saleById(id);
    });
  }

  async function addSalePayment(id, d) {
    return safe(async () => {
      await transaction(async (c) => {
        await c.query('CALL bf_add_sale_payment(?,?,?)', [id, d.paymentMethod, d.amount]);
      });
      const sale = await saleById(id);
      if (!sale) throw Object.assign(new Error('Sale not found.'), { status: 404 });
      return sale;
    });
  }

  return { report, suppliers, fruits, vendors, createPurchase, createSale, addSalePayment, saleById };
}
