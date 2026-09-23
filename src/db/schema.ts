import { pgTable, text, real, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

// Users table for database user tracking
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products / Inventory table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  category: text('category').notNull(),
  brand: text('brand').notNull(),
  price: real('price').notNull(),
  stock: integer('stock').notNull(),
  unit: text('unit').notNull(),
  description: text('description').default(''),
  specs: jsonb('specs').$type<{ label: string; value: string }[]>().default([]),
  imageUrl: text('image_url').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Customers table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company').default(''),
  phone: text('phone').notNull(),
  email: text('email').default(''),
  address: text('address').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Documents table (Invoices, Quotations, Offer Letters, Bills)
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // OFFER_LETTER, QUOTATION, BILL, INVOICE
  docNumber: text('doc_number').notNull(),
  date: text('date').notNull(),
  dueDate: text('due_date'),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerCompany: text('customer_company').default(''),
  customerPhone: text('customer_phone').default(''),
  customerEmail: text('customer_email').default(''),
  customerAddress: text('customer_address').default(''),
  
  // Specific to Offer Letter / Quotation
  subject: text('subject'),
  salutation: text('salutation'),
  openingParagraph: text('opening_paragraph'),
  closingParagraph: text('closing_paragraph'),

  // Financial Items & Totals
  items: jsonb('items').$type<{
    id: string;
    productId?: string;
    name: string;
    brand: string;
    quantity: number;
    price: number;
    total: number;
    unit: string;
  }[]>().default([]),
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  discount: real('discount').default(0),
  total: real('total').notNull(),
  paidAmount: real('paid_amount').default(0),
  dueAmount: real('due_amount').default(0),
  status: text('status').notNull(),
  terms: text('terms').default(''),
  notes: text('notes'),
  signatureLabel: text('signature_label').default('Authorized Signature'),
  signatureName: text('signature_name').default('Hitachi Air Solution Center'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Staff Users table
export const staffUsers = pgTable('staff_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  passcode: text('passcode').notNull(),
  role: text('role').notNull(),
  designation: text('designation').default(''),
  status: text('status').notNull(), // Active, Inactive
  permissions: jsonb('permissions').$type<string[]>().default([]),
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Business Settings table
export const settings = pgTable('settings', {
  id: text('id').primaryKey(), // 'global_settings'
  name: text('name').notNull(),
  slogan: text('slogan').default(''),
  address: text('address').default(''),
  phone1: text('phone1').default(''),
  phone2: text('phone2').default(''),
  email: text('email').default(''),
  website: text('website').default(''),
  invoicePrefix: text('invoice_prefix').default('INV'),
  quotePrefix: text('quote_prefix').default('QUO'),
  offerPrefix: text('offer_prefix').default('OFF'),
  billPrefix: text('bill_prefix').default('BIL'),
  taxRate: real('tax_rate').default(0),
  terms: text('terms').default(''),
  signatureName: text('signature_name').default(''),
  signatureLabel: text('signature_label').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});
