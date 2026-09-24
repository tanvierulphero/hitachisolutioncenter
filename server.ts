import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import { db } from './src/db/index.ts';
import { products, customers, documents, staffUsers, settings } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_DOCUMENTS, INITIAL_STAFF_USERS, DEFAULT_SETTINGS } from './src/initialData.ts';

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.use('/uploads', express.static(uploadsDir));
app.use(express.json({ limit: '10mb' }));

// Upload image handler for Node server
const handleUpload = (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, success: true });
};

app.post('/api/upload', upload.single('file'), handleUpload);
app.post('/api/upload.php', upload.single('file'), handleUpload);

// Helper to broadcast changes instantly
function notifyChange(entity: string, action: string, data?: any) {
  io.emit('db_change', { entity, action, data, timestamp: Date.now() });
}

io.on('connection', (socket) => {
  console.log('Real-time SQL client connected:', socket.id);
});

// Seed initial data if tables are empty
async function seedInitialDataIfNeeded() {
  try {
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
        name: item.name,
        company: item.company || '',
        phone: item.phone,
        email: item.email || '',
        address: item.address || '',
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

