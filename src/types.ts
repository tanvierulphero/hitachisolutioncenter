export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  unit: string;
  description: string;
  specs: ProductSpec[];
  imageUrl: string;
}

export interface Customer {
  id: string;
  companyId?: string; // e.g. COMP-1001
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: string;
  notes?: string;
}

export type DocumentType = 'OFFER_LETTER' | 'QUOTATION' | 'BILL' | 'INVOICE';

export type DocumentStatus = 
  | 'Draft' 
  | 'Sent' 
  | 'Paid' 
  | 'Partially Paid'
  | 'Unpaid' 
  | 'Overdue' 
  | 'Accepted' 
  | 'Declined'
  | 'Active';

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'STAFF' | 'CUSTOM';

export type PermissionKey =
  | 'view_overview'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_documents'
  | 'create_documents'
  | 'edit_documents'
  | 'delete_documents'
  | 'view_reports'
  | 'view_due_ledger'
  | 'manage_due_ledger'
  | 'view_staff_management'
  | 'manage_settings'
  | 'view_field_dispatch'
  | 'manage_field_dispatch'
  | 'view_company_profiles'
  | 'manage_company_profiles';

export interface FieldDispatchItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  unit: string;
  issuedQty: number;   // Total items taken out by staff
  soldQty: number;     // Items sold/used on site
  returnedQty: number; // Items returned back to warehouse
  unitPrice: number;
  totalPrice: number;
}

export type FieldDispatchStatus = 'Pending Return' | 'Completed' | 'Cancelled';

export interface FieldDispatch {
  id: string;
  dispatchNumber: string; // e.g. DISP/2026/0001
  staffId: string;
  staffName: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerPhone: string;
  purpose: string; // e.g. "On-site Service & Trial Demo"
  dispatchDate: string;
  returnDate?: string | null;
  status: FieldDispatchStatus;
  notes?: string;
  items: FieldDispatchItem[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passcode: string;
  role: UserRole;
  designation: string;
  status: 'Active' | 'Inactive';
  permissions: PermissionKey[];
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  productId?: string;
  name: string;
  brand: string;
  quantity: number;
  price: number;
  total: number;
  unit: string;
  warrantyMonths?: number; // e.g. 12, 18, 24
  warrantyExpiryDate?: string; // e.g. "2027-09-25"
}

export interface Document {
  id: string;
  type: DocumentType;
  docNumber: string; // e.g. JM-2026-0001
  date: string;
  dueDate?: string; // invoice/bill
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  
  // Specific to Offer Letter / Quotation
  subject?: string;
  salutation?: string;
  openingParagraph?: string;
  closingParagraph?: string;
  
  // General Document Fields
  items: DocumentItem[];
  subtotal: number;
  taxRate: number; // percentage
  taxAmount: number;
  discount: number; // flat amount
  total: number;
  paidAmount?: number; // Outstanding/Due Ledger tracking
  dueAmount?: number;  // Outstanding/Due Ledger tracking
  status: DocumentStatus;
  terms: string;
  notes?: string;
  signatureLabel: string;
  signatureName: string;
}

export interface BusinessSettings {
  name: string;
  slogan: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  invoicePrefix: string;
  quotePrefix: string;
  offerPrefix: string;
  billPrefix: string;
  taxRate: number;
  terms: string;
  signatureName: string;
  signatureLabel: string;
}
