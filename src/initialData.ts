import { Product, Customer, Document, BusinessSettings, StaffUser, PermissionKey } from './types';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string; category: string }[] = [
  { key: 'view_overview', label: 'Overview Analytics', description: 'View high-level revenue and business overview stats', category: 'General' },
  { key: 'view_inventory', label: 'View Stock Inventory', description: 'Browse spare parts and machine catalog items', category: 'Inventory' },
  { key: 'manage_inventory', label: 'Manage Stock Inventory', description: 'Add, update pricing, or remove catalog stock items', category: 'Inventory' },
  { key: 'view_documents', label: 'View Documents Hub', description: 'Access offer letters, quotations, bills, and invoices list', category: 'Documents' },
  { key: 'create_documents', label: 'Create New Documents', description: 'Generate offer letters, quotes, bills, and invoices', category: 'Documents' },
  { key: 'edit_documents', label: 'Edit Existing Documents', description: 'Modify created quotations, bills, and invoices', category: 'Documents' },
  { key: 'delete_documents', label: 'Delete Documents', description: 'Permanently purge invoices or quotation records', category: 'Documents' },
  { key: 'view_due_ledger', label: 'View Due Ledger', description: 'View customer accounts receivable and due balances', category: 'Accounts' },
  { key: 'manage_due_ledger', label: 'Collect Dues / Manage Ledger', description: 'Receive customer payments and update due balances', category: 'Accounts' },
  { key: 'view_reports', label: 'View Business Reports', description: 'Export sales, VAT, and inventory report spreadsheets', category: 'Analytics' },
  { key: 'manage_settings', label: 'Manage Showroom Settings', description: 'Configure company branding, address, and print metadata', category: 'Admin' },
  { key: 'view_staff_management', label: 'Manage Staff Sub-Accounts', description: 'Create sub-accounts and configure role access rules', category: 'Admin' },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-admin-1',
    name: 'Md. Jubayer Ahmed',
    email: 'jubayer@hitachisolutioncenter.com',
    phone: '01715-994956',
    passcode: 'admin123',
    role: 'ADMIN',
    designation: 'Managing Director & Owner',
    status: 'Active',
    createdAt: '2026-01-01',
    permissions: ALL_PERMISSIONS.map(p => p.key)
  },
  {
    id: 'staff-mgr-1',
    name: 'Kamrul Hasan',
    email: 'kamrul@hitachisolutioncenter.com',
    phone: '01799-498199',
    passcode: 'mgr123',
    role: 'MANAGER',
    designation: 'Operations Manager',
    status: 'Active',
    createdAt: '2026-01-15',
    permissions: [
      'view_overview',
      'view_inventory',
      'manage_inventory',
      'view_documents',
      'create_documents',
      'edit_documents',
      'view_due_ledger',
      'manage_due_ledger',
      'view_reports'
    ]
  },
  {
    id: 'staff-sales-1',
    name: 'Engr. Rafiqul Islam',
    email: 'rafiq@hitachisolutioncenter.com',
    phone: '01812-334455',
    passcode: 'sales123',
    role: 'SALESMAN',
    designation: 'Senior Sales Executive',
    status: 'Active',
    createdAt: '2026-02-01',
    permissions: [
      'view_overview',
      'view_inventory',
      'view_documents',
      'create_documents',
      'view_due_ledger'
    ]
  },
  {
    id: 'staff-store-1',
    name: 'Tarikul Tanvir',
    email: 'store@hitachisolutioncenter.com',
    phone: '01911-223344',
    passcode: 'staff123',
    role: 'STAFF',
    designation: 'Store & Inventory Keeper',
    status: 'Active',
    createdAt: '2026-02-10',
    permissions: [
      'view_inventory',
      'manage_inventory',
      'view_documents'
    ]
  }
];

export const DEFAULT_SETTINGS: BusinessSettings = {
  name: "hitachisolutioncenter",
  slogan: "Your Problem Solution is Sustainable Partner",
  address: "Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.",
  phone1: "01715-994956",
  phone2: "01799-498199",
  email: "info@hitachisolutioncenter.com",
  website: "www.hitachiairsolutioncenter.com",
  invoicePrefix: "HSC/INV/2026/",
  quotePrefix: "HSC/QT/2026/",
  offerPrefix: "HSC/OF/2026/",
  billPrefix: "HSC/BILL/2026/",
  taxRate: 5, // 5% VAT
  terms: "1. Delivery: Within 7 working days upon receipt of work order.\n2. Payment: 50% advance with work order & 50% upon delivery.\n3. Warranty: 1 Year comprehensive brand warranty.\n4. Validity of this offer is 30 days.",
  signatureName: "Md. Jubayer Ahmed",
  signatureLabel: "Managing Director"
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Hitachi Hiscrew 37 S-Type Screw Compressor",
    sku: "HIT-HS-37S",
    category: "Screw Air Compressor",
    brand: "Hitachi",
    price: 650000,
    stock: 3,
    unit: "Set",
    description: "High-performance S-Type oil-flooded rotary screw air compressor with advanced microprocessor control, superior energy efficiency, and low noise levels.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60", // industrial equipment
    specs: [
      { label: "Motor Power", value: "37 kW (50 HP)" },
      { label: "Free Air Delivery", value: "6.2 m³/min" },
      { label: "Working Pressure", value: "8.5 Bar" },
      { label: "Cooling Method", value: "Air Cooled" },
      { label: "Weight", value: "1150 kg" }
    ]
  },
  {
    id: "prod-2",
    name: "Atlas Copco GA37 VSD+ Variable Speed Compressor",
    sku: "AC-GA37-VSD",
    category: "Screw Air Compressor",
    brand: "Atlas Copco",
    price: 890000,
    stock: 2,
    unit: "Set",
    description: "Premium variable speed drive (VSD+) rotary screw compressor. Saves up to 50% energy compared to fixed-speed models. Elegant vertical space-saving design.",
    imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Motor Power", value: "37 kW (50 HP)" },
      { label: "Free Air Delivery", value: "1.4 - 7.6 m³/min" },
      { label: "Working Pressure", value: "4 - 13 Bar" },
      { label: "Cooling Method", value: "Air Cooled" },
      { label: "Noise Level", value: "67 dB(A)" }
    ]
  },
  {
    id: "prod-3",
    name: "Hitachi Modular Refrigerated Air Dryer 55kW",
    sku: "HIT-AD-55",
    category: "Air Dryer",
    brand: "Hitachi",
    price: 185000,
    stock: 5,
    unit: "Pcs",
    description: "High-efficiency refrigerated air dryer designed to remove moisture content from compressed air system to protect downstream pneumatic components.",
    imageUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Capacity", value: "10.5 m³/min" },
      { label: "Inlet Temperature", value: "Max 50°C" },
      { label: "Dew Point", value: "3°C - 10°C" },
      { label: "Refrigerant", value: "R134a / R407C" }
    ]
  },
  {
    id: "prod-4",
    name: "Atlas Copco DD60+ High Efficiency Coalescing Line Filter",
    sku: "AC-LF-DD60",
    category: "Line Filter",
    brand: "Atlas Copco",
    price: 32000,
    stock: 15,
    unit: "Pcs",
    description: "Coalescing air line filter for high-efficiency general purpose protection, removing liquid water and oil aerosol down to 0.1 mg/m³ (0.1 ppm) and particles down to 1 micron.",
    imageUrl: "https://images.unsplash.com/photo-1585713181935-d5f622cc2415?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Max Flow Rate", value: "60 l/s" },
      { label: "Filtration Grade", value: "DD+ High Efficiency" },
      { label: "Max Pressure", value: "16 Bar" },
      { label: "Connection", value: "G 1\"" }
    ]
  },
  {
    id: "prod-5",
    name: "Genuine Air Filter for Hitachi 22kW Compressor",
    sku: "HIT-AF-22K",
    category: "Spare Parts",
    brand: "Hitachi",
    price: 12500,
    stock: 25,
    unit: "Pcs",
    description: "Genuine Hitachi air filter element to prevent dust and dirt particles from entering the compressor screw block, ensuring maximum longevity and performance.",
    imageUrl: "https://images.unsplash.com/photo-1530124560676-1055107c3ed0?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Compatible Model", value: "HISCREW 22 Series" },
      { label: "Filtration Rating", value: "3 Microns" },
      { label: "Material", value: "Special Cellulose Fiber" }
    ]
  },
  {
    id: "prod-6",
    name: "Genuine Oil Separator Element AC-GA37",
    sku: "AC-OS-GA37",
    category: "Spare Parts",
    brand: "Atlas Copco",
    price: 24000,
    stock: 12,
    unit: "Pcs",
    description: "Atlas Copco genuine replacement oil-air separator element. Guarantees minimum residual oil carryover in air (less than 2ppm) and maintains low pressure drop.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Compatible Model", value: "GA 30, GA 37, GA 45" },
      { label: "Residual Oil Content", value: "< 2 ppm" },
      { label: "Max Temp", value: "120°C" }
    ]
  },
  {
    id: "prod-7",
    name: "Hitachi Screw Compressor Lubricant Oil (Food Grade)",
    sku: "HIT-OIL-FG",
    category: "Spare Parts",
    brand: "Hitachi",
    price: 45000,
    stock: 8,
    unit: "Can (20L)",
    description: "Premium synthetic food-grade lubricant oil for rotary screw compressors. Highly stable against oxidation, thermal breakdowns, and sludge formations.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60",
    specs: [
      { label: "Volume", value: "20 Litres" },
      { label: "Viscosity Index", value: "ISO VG 46" },
      { label: "Lifetime", value: "4000 Hours" }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Sabbir Rahman",
    company: "Apex Textile Printing & Dyeing Ltd.",
    phone: "01712-456789",
    email: "sabbir@apextextile.com",
    address: "Konabari Industrial Area, Gazipur, Bangladesh."
  },
  {
    id: "cust-2",
    name: "Mohammad Yusuf",
    company: "Standard Group Washing Division",
    phone: "01819-987654",
    email: "yusuf.m@standard-group.com",
    address: "Bason Sharok, Gazipur City, Gazipur."
  },
  {
    id: "cust-3",
    name: "Engr. Tanvir Ahmed",
    company: "Dhaka Auto Bricks Mills",
    phone: "01911-334455",
    email: "tanvir.engr@dhakabricks.com",
    address: "Joydebpur Road, Gazipur."
  },
  {
    id: "cust-4",
    name: "Kazi Monirul Islam",
    company: "Hamid Fabrics Limited",
    phone: "01552-887766",
    email: "monirul@hamidfabrics.com",
    address: "Sreepur, Gazipur, Bangladesh."
  }
];

export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: "doc-1",
    type: "OFFER_LETTER",
    docNumber: "HSC/OF/2026/0001",
    date: "2026-09-15",
    customerId: "cust-1",
    customerName: "Sabbir Rahman",
    customerCompany: "Apex Textile Printing & Dyeing Ltd.",
    customerPhone: "01712-456789",
    customerEmail: "sabbir@apextextile.com",
    customerAddress: "Konabari Industrial Area, Gazipur, Bangladesh.",
    subject: "Offer Letter for Premium Hitachi Rotary Screw Compressor Parts & Oil",
    salutation: "Dear Sir,",
    openingParagraph: "We refer to our recent discussion regarding the spare parts requirement for your Hitachi 37kW Screw Compressor. hitachisolutioncenter is highly pleased to submit our offer letter detailing our capability to supply genuine filters and lubricant oil to keep your factory running with zero downtime.",
    closingParagraph: "We trust that our proposal meets your requirements. We are standing by to support your plant operations with high-quality services. Please let us know if you require any further technical assistance.",
    items: [
      {
        id: "item-1",
        productId: "prod-5",
        name: "Genuine Air Filter for Hitachi 22kW/37kW Compressor",
        brand: "Hitachi",
        quantity: 2,
        price: 12500,
        total: 25000,
        unit: "Pcs"
      },
      {
        id: "item-2",
        productId: "prod-7",
        name: "Hitachi Screw Compressor Lubricant Oil (Food Grade)",
        brand: "Hitachi",
        quantity: 1,
        price: 45000,
        total: 45000,
        unit: "Can (20L)"
      }
    ],
    subtotal: 70000,
    taxRate: 5,
    taxAmount: 3500,
    discount: 5000,
    total: 68500,
    status: "Active",
    terms: "1. Delivery: Within 2-3 working days.\n2. Payment: Cash or Cheque in favor of hitachisolutioncenter upon delivery.\n3. Product: 100% Genuine brand quality parts.",
    signatureName: "Md. Jubayer Ahmed",
    signatureLabel: "Managing Director"
  },
  {
    id: "doc-2",
    type: "QUOTATION",
    docNumber: "HSC/QT/2026/0024",
    date: "2026-09-16",
    customerId: "cust-2",
    customerName: "Mohammad Yusuf",
    customerCompany: "Standard Group Washing Division",
    customerPhone: "01819-987654",
    customerEmail: "yusuf.m@standard-group.com",
    customerAddress: "Bason Sharok, Gazipur City, Gazipur.",
    subject: "Quotation for Brand New Atlas Copco Variable Speed Compressor GA37 VSD+",
    salutation: "Dear Mr. Yusuf,",
    openingParagraph: "Thank you for giving us the opportunity to quote our high-efficiency industrial compressed air solutions. Below, please find our most competitive quotation for the supply and commissioning of a world-class Atlas Copco Variable Speed Compressor, along with line filters to ensure immaculate dry air for your wash plant.",
    closingParagraph: "We hope this quotation matches your expectations and standard plant parameters. Looking forward to your valued work order. We are fully committed to sustainable partnership.",
    items: [
      {
        id: "item-3",
        productId: "prod-2",
        name: "Atlas Copco GA37 VSD+ Variable Speed Compressor",
        brand: "Atlas Copco",
        quantity: 1,
        price: 890000,
        total: 890000,
        unit: "Set"
      },
      {
        id: "item-4",
        productId: "prod-4",
        name: "Atlas Copco DD60+ High Efficiency Coalescing Line Filter",
        brand: "Atlas Copco",
        quantity: 2,
        price: 32000,
        total: 64000,
        unit: "Pcs"
      }
    ],
    subtotal: 954000,
    taxRate: 5,
    taxAmount: 47700,
    discount: 14000,
    total: 987700,
    status: "Sent",
    terms: "1. Delivery: Ex-stock Gazipur showroom.\n2. Price: Includes delivery and installation support within Gazipur district.\n3. Warranty: 18 Months mechanical warranty from commission.\n4. Subject to standard business clauses.",
    signatureName: "Md. Jubayer Ahmed",
    signatureLabel: "Managing Director"
  },
  {
    id: "doc-3",
    type: "INVOICE",
    docNumber: "HSC/INV/2026/0152",
    date: "2026-09-17",
    dueDate: "2026-10-17",
    customerId: "cust-1",
    customerName: "Sabbir Rahman",
    customerCompany: "Apex Textile Printing & Dyeing Ltd.",
    customerPhone: "01712-456789",
    customerEmail: "sabbir@apextextile.com",
    customerAddress: "Konabari Industrial Area, Gazipur, Bangladesh.",
    items: [
      {
        id: "item-5",
        productId: "prod-1",
        name: "Hitachi Hiscrew 37 S-Type Screw Compressor",
        brand: "Hitachi",
        quantity: 1,
        price: 650000,
        total: 650000,
        unit: "Set"
      },
      {
        id: "item-6",
        productId: "prod-3",
        name: "Hitachi Modular Refrigerated Air Dryer 55kW",
        brand: "Hitachi",
        quantity: 1,
        price: 185000,
        total: 185000,
        unit: "Pcs"
      }
    ],
    subtotal: 835000,
    taxRate: 5,
    taxAmount: 41750,
    discount: 25000,
    total: 851750,
    status: "Paid",
    terms: "This invoice is fully paid. Thank you for choosing hitachisolutioncenter as your sustainable partner.",
    signatureName: "Md. Jubayer Ahmed",
    signatureLabel: "Managing Director"
  },
  {
    id: "doc-4",
    type: "BILL",
    docNumber: "HSC/BILL/2026/0091",
    date: "2026-09-14",
    dueDate: "2026-09-28",
    customerId: "cust-3",
    customerName: "Engr. Tanvir Ahmed",
    customerCompany: "Dhaka Auto Bricks Mills",
    customerPhone: "01911-334455",
    customerEmail: "tanvir.engr@dhakabricks.com",
    customerAddress: "Joydebpur Road, Gazipur.",
    items: [
      {
        id: "item-7",
        productId: "prod-6",
        name: "Genuine Oil Separator Element AC-GA37",
        brand: "Atlas Copco",
        quantity: 3,
        price: 24000,
        total: 72000,
        unit: "Pcs"
      }
    ],
    subtotal: 72000,
    taxRate: 5,
    taxAmount: 3600,
    discount: 0,
    total: 75600,
    status: "Unpaid",
    terms: "Payment should be cleared within 14 days of bill submission.",
    signatureName: "Md. Jubayer Ahmed",
    signatureLabel: "Managing Director"
  }
];
