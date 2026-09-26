import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import { db } from './src/db/index.ts';
import { products, customers, documents, staffUsers, settings, fieldDispatches, suppliers, purchases } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_DOCUMENTS, INITIAL_STAFF_USERS, DEFAULT_SETTINGS, INITIAL_FIELD_DISPATCHES, INITIAL_SUPPLIERS, INITIAL_PURCHASES } from './src/initialData.ts';

const app = express();
const port = 3000;

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

// Configure upload storage
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const newName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, newName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

app.use('/uploads', express.static(uploadsDir));
app.use(express.json({ limit: '25mb' }));

// Upload image handler for Node server
const handleUpload = (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, success: true });
};

app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    handleUpload(req, res);
  });
});

app.post('/api/upload.php', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    handleUpload(req, res);
  });
});

// Helper to broadcast changes instantly
function notifyChange(entity: string, action: string, data?: any) {
  io.emit('db_change', { entity, action, data, timestamp: Date.now() });
}

io.on('connection', (socket) => {
  console.log('Real-time SQL client connected:', socket.id);
});

// Ensure PostgreSQL table extensions and columns exist
async function initDbMigrations() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS field_dispatches (
        id text PRIMARY KEY NOT NULL,
        dispatch_number text NOT NULL,
        staff_id text NOT NULL,
        staff_name text NOT NULL,
        customer_id text NOT NULL,
        customer_name text NOT NULL,
        customer_company text DEFAULT '',
        customer_phone text DEFAULT '',
        purpose text DEFAULT '',
        dispatch_date text NOT NULL,
        return_date text,
        status text NOT NULL,
        notes text DEFAULT '',
        items jsonb DEFAULT '[]'::jsonb,
        updated_at timestamp DEFAULT now()
      );
    `).catch(() => {});

    await db.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id text PRIMARY KEY NOT NULL,
        supplier_id text DEFAULT '',
        name text NOT NULL,
        company text DEFAULT '',
        phone text NOT NULL,
        email text DEFAULT '',
        address text DEFAULT '',
        contact_person text DEFAULT '',
        notes text DEFAULT '',
        created_at text DEFAULT '',
        updated_at timestamp DEFAULT now()
      );
    `).catch(() => {});

    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchases (
        id text PRIMARY KEY NOT NULL,
        purchase_number text NOT NULL,
        supplier_invoice_no text DEFAULT '',
        supplier_id text NOT NULL,
        supplier_name text NOT NULL,
        supplier_company text DEFAULT '',
        supplier_phone text DEFAULT '',
        supplier_email text DEFAULT '',
        supplier_address text DEFAULT '',
        purchase_date text NOT NULL,
        items jsonb DEFAULT '[]'::jsonb,
        subtotal real NOT NULL DEFAULT 0,
        tax_rate real DEFAULT 0,
        tax_amount real DEFAULT 0,
        discount real DEFAULT 0,
        shipping_cost real DEFAULT 0,
        grand_total real NOT NULL DEFAULT 0,
        paid_amount real DEFAULT 0,
        due_amount real DEFAULT 0,
        payment_status text NOT NULL,
        payment_method text NOT NULL,
        status text NOT NULL,
        notes text DEFAULT '',
        created_at text DEFAULT '',
        updated_at timestamp DEFAULT now()
      );
    `).catch(() => {});

    await db.execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id text DEFAULT '';`).catch(() => {});
    await db.execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes text DEFAULT '';`).catch(() => {});
  } catch (err) {
    console.error('DB Migration notice:', err);
  }
}

// Run DB migrations immediately on startup
initDbMigrations();

// Seed initial data if tables are empty
async function seedInitialDataIfNeeded() {
  try {
    await initDbMigrations();

    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      console.log('Seeding initial products into Cloud SQL...');
      for (const p of INITIAL_PRODUCTS) {
        await db.insert(products).values(p).onConflictDoNothing();
      }
    }

    const existingCustomers = await db.select().from(customers).limit(1);
    if (existingCustomers.length === 0) {
      console.log('Seeding initial customers into Cloud SQL...');
      for (const c of INITIAL_CUSTOMERS) {
        await db.insert(customers).values(c).onConflictDoNothing();
      }
    }

    const existingSuppliers = await db.select().from(suppliers).limit(1);
    if (existingSuppliers.length === 0) {
      console.log('Seeding initial suppliers into Cloud SQL...');
      for (const s of INITIAL_SUPPLIERS) {
        await db.insert(suppliers).values(s).onConflictDoNothing();
      }
    }

    const existingPurchases = await db.select().from(purchases).limit(1);
    if (existingPurchases.length === 0) {
      console.log('Seeding initial purchases into Cloud SQL...');
      for (const p of INITIAL_PURCHASES) {
        await db.insert(purchases).values(p).onConflictDoNothing();
      }
    }

    const existingDocs = await db.select().from(documents).limit(1);
    if (existingDocs.length === 0) {
      console.log('Seeding initial documents into Cloud SQL...');
      for (const d of INITIAL_DOCUMENTS) {
        await db.insert(documents).values(d).onConflictDoNothing();
      }
    }

    const existingStaff = await db.select().from(staffUsers).limit(1);
    if (existingStaff.length === 0) {
      console.log('Seeding initial staff users into Cloud SQL...');
      for (const s of INITIAL_STAFF_USERS) {
        await db.insert(staffUsers).values(s).onConflictDoNothing();
      }
    }

    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
      console.log('Seeding initial settings into Cloud SQL...');
      await db.insert(settings).values({
        id: 'global_settings',
        ...DEFAULT_SETTINGS,
      }).onConflictDoNothing();
    }

    const existingDispatches = await db.select().from(fieldDispatches).limit(1);
    if (existingDispatches.length === 0) {
      console.log('Seeding initial field dispatches into Cloud SQL...');
      for (const fd of INITIAL_FIELD_DISPATCHES) {
        await db.insert(fieldDispatches).values(fd).onConflictDoNothing();
      }
    }
  } catch (err) {
    console.error('Data seeding check encountered non-fatal error:', err);
  }
}

// REST API Routes
// 1. Products
app.get('/api/products', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(products);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch products:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing product ID' });
    }
    await db.insert(products).values(item).onConflictDoUpdate({
      target: products.id,
      set: {
        name: item.name,
        sku: item.sku,
        category: item.category,
        brand: item.brand,
        price: item.price,
        stock: item.stock,
        unit: item.unit,
        description: item.description || '',
        specs: item.specs || [],
        imageUrl: item.imageUrl || '',
      },
    });
    notifyChange('products', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save product:', err);
    res.status(500).json({ error: err.message || 'Failed to save product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(products).where(eq(products.id, id));
    notifyChange('products', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete product:', err);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// 2. Customers
app.get('/api/customers', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(customers);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch customers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing customer ID' });
    }
    await db.insert(customers).values(item).onConflictDoUpdate({
      target: customers.id,
      set: {
        companyId: item.companyId || '',
        name: item.name,
        company: item.company || '',
        phone: item.phone,
        email: item.email || '',
        address: item.address || '',
        notes: item.notes || '',
      },
    });
    notifyChange('customers', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save customer:', err);
    res.status(500).json({ error: err.message || 'Failed to save customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(customers).where(eq(customers.id, id));
    notifyChange('customers', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete customer:', err);
    res.status(500).json({ error: err.message || 'Failed to delete customer' });
  }
});

// 3. Documents
app.get('/api/documents', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(documents);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch documents:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch documents' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing document ID' });
    }
    await db.insert(documents).values(item).onConflictDoUpdate({
      target: documents.id,
      set: {
        type: item.type,
        docNumber: item.docNumber,
        date: item.date,
        dueDate: item.dueDate || null,
        customerId: item.customerId,
        customerName: item.customerName,
        customerCompany: item.customerCompany || '',
        customerPhone: item.customerPhone || '',
        customerEmail: item.customerEmail || '',
        customerAddress: item.customerAddress || '',
        subject: item.subject || null,
        salutation: item.salutation || null,
        openingParagraph: item.openingParagraph || null,
        closingParagraph: item.closingParagraph || null,
        items: item.items || [],
        subtotal: item.subtotal,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        discount: item.discount || 0,
        total: item.total,
        paidAmount: item.paidAmount || 0,
        dueAmount: item.dueAmount || 0,
        status: item.status,
        terms: item.terms || '',
        notes: item.notes || null,
        signatureLabel: item.signatureLabel || 'Authorized Signature',
        signatureName: item.signatureName || 'Hitachi Air Solution Center',
      },
    });
    notifyChange('documents', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save document:', err);
    res.status(500).json({ error: err.message || 'Failed to save document' });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(documents).where(eq(documents.id, id));
    notifyChange('documents', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete document:', err);
    res.status(500).json({ error: err.message || 'Failed to delete document' });
  }
});

// 4. Staff Users
app.get('/api/staff', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(staffUsers);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch staff:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch staff' });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing staff user ID' });
    }
    await db.insert(staffUsers).values(item).onConflictDoUpdate({
      target: staffUsers.id,
      set: {
        name: item.name,
        email: item.email,
        phone: item.phone || '',
        passcode: item.passcode,
        role: item.role,
        designation: item.designation || '',
        status: item.status,
        permissions: item.permissions || [],
        createdAt: item.createdAt || new Date().toISOString().split('T')[0],
      },
    });
    notifyChange('staff', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save staff:', err);
    res.status(500).json({ error: err.message || 'Failed to save staff' });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(staffUsers).where(eq(staffUsers.id, id));
    notifyChange('staff', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete staff user:', err);
    res.status(500).json({ error: err.message || 'Failed to delete staff user' });
  }
});

// 5. Business Settings
app.get('/api/settings', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(settings).where(eq(settings.id, 'global_settings'));
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json(DEFAULT_SETTINGS);
    }
  } catch (err: any) {
    console.error('Failed to fetch settings:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const item = req.body;
    await db.insert(settings).values({
      id: 'global_settings',
      ...item,
    }).onConflictDoUpdate({
      target: settings.id,
      set: {
        name: item.name,
        slogan: item.slogan || '',
        address: item.address || '',
        phone1: item.phone1 || '',
        phone2: item.phone2 || '',
        email: item.email || '',
        website: item.website || '',
        invoicePrefix: item.invoicePrefix || 'INV',
        quotePrefix: item.quotePrefix || 'QUO',
        offerPrefix: item.offerPrefix || 'OFF',
        billPrefix: item.billPrefix || 'BIL',
        taxRate: item.taxRate || 0,
        terms: item.terms || '',
        signatureName: item.signatureName || '',
        signatureLabel: item.signatureLabel || '',
      },
    });
    notifyChange('settings', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save settings:', err);
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

// 6. Field Dispatches (Movement & Returns)
app.get('/api/field-dispatches', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(fieldDispatches);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch field dispatches:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch field dispatches' });
  }
});

app.post('/api/field-dispatches', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing field dispatch ID' });
    }
    await db.insert(fieldDispatches).values(item).onConflictDoUpdate({
      target: fieldDispatches.id,
      set: {
        dispatchNumber: item.dispatchNumber,
        staffId: item.staffId,
        staffName: item.staffName,
        customerId: item.customerId,
        customerName: item.customerName,
        customerCompany: item.customerCompany || '',
        customerPhone: item.customerPhone || '',
        purpose: item.purpose || '',
        dispatchDate: item.dispatchDate,
        returnDate: item.returnDate || null,
        status: item.status,
        notes: item.notes || '',
        items: item.items || [],
      },
    });
    notifyChange('dispatches', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save field dispatch:', err);
    res.status(500).json({ error: err.message || 'Failed to save field dispatch' });
  }
});

app.delete('/api/field-dispatches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(fieldDispatches).where(eq(fieldDispatches.id, id));
    notifyChange('dispatches', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete field dispatch:', err);
    res.status(500).json({ error: err.message || 'Failed to delete field dispatch' });
  }
});

// 7. Suppliers
app.get('/api/suppliers', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(suppliers);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch suppliers:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing supplier ID' });
    }
    await db.insert(suppliers).values(item).onConflictDoUpdate({
      target: suppliers.id,
      set: {
        supplierId: item.supplierId || '',
        name: item.name,
        company: item.company || '',
        phone: item.phone,
        email: item.email || '',
        address: item.address || '',
        contactPerson: item.contactPerson || '',
        notes: item.notes || '',
        createdAt: item.createdAt || '',
      },
    });
    notifyChange('suppliers', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save supplier:', err);
    res.status(500).json({ error: err.message || 'Failed to save supplier' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(suppliers).where(eq(suppliers.id, id));
    notifyChange('suppliers', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete supplier:', err);
    res.status(500).json({ error: err.message || 'Failed to delete supplier' });
  }
});

// 8. Purchases / Stock Inward
app.get('/api/purchases', async (_req, res) => {
  try {
    await seedInitialDataIfNeeded();
    const result = await db.select().from(purchases);
    res.json(result);
  } catch (err: any) {
    console.error('Failed to fetch purchases:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch purchases' });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id) {
      return res.status(400).json({ error: 'Missing purchase ID' });
    }
    await db.insert(purchases).values(item).onConflictDoUpdate({
      target: purchases.id,
      set: {
        purchaseNumber: item.purchaseNumber,
        supplierInvoiceNo: item.supplierInvoiceNo || '',
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        supplierCompany: item.supplierCompany || '',
        supplierPhone: item.supplierPhone || '',
        supplierEmail: item.supplierEmail || '',
        supplierAddress: item.supplierAddress || '',
        purchaseDate: item.purchaseDate,
        items: item.items || [],
        subtotal: item.subtotal,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        discount: item.discount || 0,
        shippingCost: item.shippingCost || 0,
        grandTotal: item.grandTotal,
        paidAmount: item.paidAmount || 0,
        dueAmount: item.dueAmount || 0,
        paymentStatus: item.paymentStatus,
        paymentMethod: item.paymentMethod,
        status: item.status,
        notes: item.notes || '',
        createdAt: item.createdAt || '',
      },
    });
    notifyChange('purchases', 'save', item);
    res.json(item);
  } catch (err: any) {
    console.error('Failed to save purchase:', err);
    res.status(500).json({ error: err.message || 'Failed to save purchase' });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(purchases).where(eq(purchases.id, id));
    notifyChange('purchases', 'delete', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete purchase:', err);
    res.status(500).json({ error: err.message || 'Failed to delete purchase' });
  }
});

// 9. Database & Server Health Diagnostics Check
app.get('/api/health', async (_req, res) => {
  const startTime = Date.now();
  try {
    await seedInitialDataIfNeeded();
    const pCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM products;`);
    const cCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM customers;`);
    const dCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM documents;`);
    const sCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM staff_users;`);
    const fCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM field_dispatches;`);
    const supCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM suppliers;`).catch(() => ({ rows: [{ count: 0 }] }));
    const purCountRes: any = await db.execute(`SELECT COUNT(*) as count FROM purchases;`).catch(() => ({ rows: [{ count: 0 }] }));

    const pCount = pCountRes?.rows?.[0]?.count ?? pCountRes?.[0]?.count ?? 0;
    const cCount = cCountRes?.rows?.[0]?.count ?? cCountRes?.[0]?.count ?? 0;
    const dCount = dCountRes?.rows?.[0]?.count ?? dCountRes?.[0]?.count ?? 0;
    const sCount = sCountRes?.rows?.[0]?.count ?? sCountRes?.[0]?.count ?? 0;
    const fCount = fCountRes?.rows?.[0]?.count ?? fCountRes?.[0]?.count ?? 0;
    const supCount = supCountRes?.rows?.[0]?.count ?? supCountRes?.[0]?.count ?? 0;
    const purCount = purCountRes?.rows?.[0]?.count ?? purCountRes?.[0]?.count ?? 0;

    const latency = Date.now() - startTime;
    res.json({
      status: 'ok',
      database: 'PostgreSQL (Cloud SQL Database)',
      connected: true,
      latencyMs: latency,
      tables: {
        products: Number(pCount),
        customers: Number(cCount),
        documents: Number(dCount),
        staff_users: Number(sCount),
        field_dispatches: Number(fCount),
        suppliers: Number(supCount),
        purchases: Number(purCount),
      },
      uploadsFolderWritable: fs.existsSync(uploadsDir),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      connected: false,
      error: err.message || 'Database connection error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Vite middleware for frontend app in development mode
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
}

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server with Real-Time WebSockets listening on http://0.0.0.0:${port}`);
});

