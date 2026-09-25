import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Product, Customer, Document, BusinessSettings, DocumentType, StaffUser, PermissionKey, FieldDispatch } from './types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_DOCUMENTS,
  INITIAL_STAFF_USERS,
  INITIAL_FIELD_DISPATCHES
} from './initialData';

// Component imports
import PublicCatalog from './components/PublicCatalog';
import AdminLogin from './components/AdminLogin';
import PrintDocument from './components/PrintDocument';
import DashboardOverview from './components/DashboardOverview';
import InventoryManager from './components/InventoryManager';
import DocumentCreator from './components/DocumentCreator';
import DocumentList from './components/DocumentList';
import ReportsHub from './components/ReportsHub';
import DueLedger from './components/DueLedger';
import StaffManagement from './components/StaffManagement';
import FieldDispatchManager from './components/FieldDispatchManager';
import CompanyProfileManager from './components/CompanyProfileManager';

import { 
  BarChart3, 
  ShoppingCart, 
  FileSpreadsheet, 
  Globe, 
  FileText, 
  Sliders, 
  Save, 
  ShieldCheck,
  UserCheck,
  Trash2,
  RotateCcw,
  Database,
  FolderLock,
  Zap,
  Truck,
  Building2
} from 'lucide-react';
import { 
  apiGetProducts,
  apiSaveProduct,
  apiDeleteProduct,
  apiGetCustomers,
  apiSaveCustomer,
  apiDeleteCustomer,
  apiGetDocuments,
  apiSaveDocument,
  apiDeleteDocument,
  apiGetStaff,
  apiSaveStaff,
  apiDeleteStaff,
  apiGetSettings,
  apiSaveSettings,
  apiGetFieldDispatches,
  apiSaveFieldDispatch,
  apiDeleteFieldDispatch
} from './lib/api';
import Logo from './components/Logo';

export default function App() {
  // Authentication & Layout Views
  // "catalog" | "login" | "dashboard"
  const [currentView, setCurrentView] = useState<'catalog' | 'login' | 'dashboard'>('dashboard');
  const [activeTab, setActiveTab] = useState<string>('overview'); // "overview", "inventory", "docs", "reports", "due_ledger", "staff_management", "settings"

  // Staff Sub-Accounts & Current Active User
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(INITIAL_STAFF_USERS[0]);

  // Core Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dispatches, setDispatches] = useState<FieldDispatch[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  // Focus workflows
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isCreatingDoc, setIsCreatingDoc] = useState<DocumentType | null>(null);

  // Temporary Settings Edit Form State
  const [settingsForm, setSettingsForm] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false);

  // Helper: Permission check
  const hasPermission = (perm: PermissionKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    return currentUser.permissions.includes(perm);
  };

  // Fetch all data from Cloud SQL Database on load with localStorage fallback
  const loadCloudSqlData = async () => {
    // 1. Initial hydrate from localStorage cache for instant zero-latency load
    const cachedProds = localStorage.getItem('hsc_products');
    const cachedCusts = localStorage.getItem('hsc_customers');
    const cachedDocs = localStorage.getItem('hsc_documents');
    const cachedDispatches = localStorage.getItem('hsc_dispatches');

    if (cachedProds) setProducts(JSON.parse(cachedProds));
    if (cachedCusts) setCustomers(JSON.parse(cachedCusts));
    if (cachedDocs) setDocuments(JSON.parse(cachedDocs));
    if (cachedDispatches) setDispatches(JSON.parse(cachedDispatches));

    try {
      const [prods, custs, docs, staff, setts, disps] = await Promise.all([
        apiGetProducts().catch(() => cachedProds ? JSON.parse(cachedProds) : INITIAL_PRODUCTS),
        apiGetCustomers().catch(() => cachedCusts ? JSON.parse(cachedCusts) : INITIAL_CUSTOMERS),
        apiGetDocuments().catch(() => cachedDocs ? JSON.parse(cachedDocs) : INITIAL_DOCUMENTS),
        apiGetStaff().catch(() => INITIAL_STAFF_USERS),
        apiGetSettings().catch(() => DEFAULT_SETTINGS),
        apiGetFieldDispatches().catch(() => cachedDispatches ? JSON.parse(cachedDispatches) : INITIAL_FIELD_DISPATCHES)
      ]);

      if (prods && prods.length > 0) {
        setProducts(prods);
        localStorage.setItem('hsc_products', JSON.stringify(prods));
      } else if (!cachedProds) {
        setProducts(INITIAL_PRODUCTS);
      }

      if (custs && custs.length > 0) {
        setCustomers(custs);
        localStorage.setItem('hsc_customers', JSON.stringify(custs));
      } else if (!cachedCusts) {
        setCustomers(INITIAL_CUSTOMERS);
      }

      if (docs && docs.length > 0) {
        setDocuments(docs);
        localStorage.setItem('hsc_documents', JSON.stringify(docs));
      } else if (!cachedDocs) {
        setDocuments(INITIAL_DOCUMENTS);
      }

      if (disps && disps.length > 0) {
        setDispatches(disps);
        localStorage.setItem('hsc_dispatches', JSON.stringify(disps));
      } else if (!cachedDispatches) {
        setDispatches(INITIAL_FIELD_DISPATCHES);
      }

      setStaffUsers(staff.length > 0 ? staff : INITIAL_STAFF_USERS);
      setSettings(setts);
      setSettingsForm(setts);

      // Current active user restoration
      const savedCurrentUser = localStorage.getItem('jm_current_user');
      if (savedCurrentUser) {
        setCurrentUser(JSON.parse(savedCurrentUser));
      } else if (staff.length > 0) {
        setCurrentUser(staff[0]);
      } else {
        setCurrentUser(INITIAL_STAFF_USERS[0]);
      }
    } catch (e) {
      console.error('Initial fetch warning:', e);
    }
  };

  useEffect(() => {
    loadCloudSqlData();

    // Establish Real-Time Socket Connection
    const socket = io();

    socket.on('db_change', (change) => {
      console.log('Real-Time SQL Change Notification Received:', change);
      if (change.entity === 'products') {
        apiGetProducts().then(setProducts).catch(() => {});
      } else if (change.entity === 'customers') {
        apiGetCustomers().then(setCustomers).catch(() => {});
      } else if (change.entity === 'documents') {
        apiGetDocuments().then(setDocuments).catch(() => {});
      } else if (change.entity === 'staff') {
        apiGetStaff().then(setStaffUsers).catch(() => {});
      } else if (change.entity === 'settings') {
        apiGetSettings().then(s => { setSettings(s); setSettingsForm(s); }).catch(() => {});
      } else if (change.entity === 'dispatches') {
        apiGetFieldDispatches().then(setDispatches).catch(() => {});
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Staff Account Handlers
  const handleAddStaff = async (newStaff: StaffUser) => {
    const updated = [newStaff, ...staffUsers];
    setStaffUsers(updated);
    try {
      await apiSaveStaff(newStaff);
    } catch (e) {
      console.error('Failed to save staff to Cloud SQL:', e);
    }
  };

  const handleUpdateStaff = async (updatedStaff: StaffUser) => {
    const updated = staffUsers.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    setStaffUsers(updated);
    if (currentUser?.id === updatedStaff.id) {
      setCurrentUser(updatedStaff);
      localStorage.setItem('jm_current_user', JSON.stringify(updatedStaff));
    }
    try {
      await apiSaveStaff(updatedStaff);
    } catch (e) {
      console.error('Failed to update staff in Cloud SQL:', e);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const updated = staffUsers.filter(s => s.id !== id);
    setStaffUsers(updated);
    try {
      await apiDeleteStaff(id);
    } catch (e) {
      console.error('Failed to delete staff from Cloud SQL:', e);
    }
  };

  const handleLoginUser = (user: StaffUser) => {
    setCurrentUser(user);
    localStorage.setItem('jm_current_user', JSON.stringify(user));
    setCurrentView('dashboard');
    
    // Auto redirect to permitted default tab
    if (user.role === 'ADMIN' || user.permissions.includes('view_overview')) setActiveTab('overview');
    else if (user.permissions.includes('view_inventory')) setActiveTab('inventory');
    else if (user.permissions.includes('view_documents')) setActiveTab('docs');
    else if (user.permissions.includes('view_due_ledger')) setActiveTab('due_ledger');
    else if (user.permissions.includes('view_reports')) setActiveTab('reports');
    else if (user.permissions.includes('view_staff_management')) setActiveTab('staff_management');
    else if (user.permissions.includes('manage_settings')) setActiveTab('settings');
  };

  // Clear All Data Handler (for fresh entry)
  const handleClearAllData = async () => {
    if (window.confirm("Are you sure you want to clear ALL documents, inventory items, and customer records in Cloud SQL?")) {
      try {
        for (const p of products) await apiDeleteProduct(p.id).catch(() => {});
        for (const c of customers) await apiDeleteCustomer(c.id).catch(() => {});
        for (const d of documents) await apiDeleteDocument(d.id).catch(() => {});
        setProducts([]);
        setCustomers([]);
        setDocuments([]);
        alert("Cloud SQL Database cleared successfully!");
      } catch (e) {
        alert("Error clearing database. Please try again.");
      }
    }
  };

  // Restore Sample Demo Data Handler
  const handleRestoreSampleData = async () => {
    if (window.confirm("Restore sample demo products, customers, and documents to Cloud SQL?")) {
      try {
        setProducts(INITIAL_PRODUCTS);
        setCustomers(INITIAL_CUSTOMERS);
        setDocuments(INITIAL_DOCUMENTS);

        for (const p of INITIAL_PRODUCTS) await apiSaveProduct(p);
        for (const c of INITIAL_CUSTOMERS) await apiSaveCustomer(c);
        for (const d of INITIAL_DOCUMENTS) await apiSaveDocument(d);

        alert("Sample demo data restored successfully to Cloud SQL!");
      } catch (e) {
        console.error('Error restoring sample data:', e);
        alert('Error restoring demo data.');
      }
    }
  };

  // HANDLERS FOR INVENTORY / PRODUCTS
  const handleAddProduct = async (p: Product) => {
    const list = [p, ...products];
    setProducts(list);
    localStorage.setItem('hsc_products', JSON.stringify(list));
    try {
      await apiSaveProduct(p);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
      // Data is saved in local browser state & localStorage
    }
  };

  const handleUpdateProduct = async (p: Product) => {
    const list = products.map(item => item.id === p.id ? p : item);
    setProducts(list);
    localStorage.setItem('hsc_products', JSON.stringify(list));
    try {
      await apiSaveProduct(p);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const list = products.filter(p => p.id !== id);
    setProducts(list);
    localStorage.setItem('hsc_products', JSON.stringify(list));
    try {
      await apiDeleteProduct(id);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
  };

  // HANDLERS FOR CUSTOMERS
  const handleAddCustomer = async (c: Customer) => {
    const list = [c, ...customers];
    setCustomers(list);
    localStorage.setItem('hsc_customers', JSON.stringify(list));
    try {
      await apiSaveCustomer(c);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
  };

  // HANDLERS FOR DOCUMENTS
  const handleSaveDocument = async (doc: Document) => {
    let list = [...documents];
    const exists = documents.some(d => d.id === doc.id);
    if (exists) {
      list = documents.map(d => d.id === doc.id ? doc : d);
    } else {
      list = [doc, ...documents];
    }
    setDocuments(list);
    localStorage.setItem('hsc_documents', JSON.stringify(list));

    try {
      await apiSaveDocument(doc);
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
    }
    
    // Decrement stock levels if a paid sales invoice is created
    if (doc.type === 'INVOICE' && doc.status === 'Paid' && !exists) {
      const updatedProducts = products.map(prod => {
        const itemInDoc = doc.items.find(it => it.productId === prod.id);
        if (itemInDoc) {
          const updatedProd = {
            ...prod,
            stock: Math.max(0, prod.stock - itemInDoc.quantity)
          };
          apiSaveProduct(updatedProd).catch(() => {});
          return updatedProd;
        }
        return prod;
      });
      setProducts(updatedProducts);
    }

    setEditingDocument(null);
    setIsCreatingDoc(null);
    setActiveTab('docs');
    setViewingDocument(doc); // View the printable layout immediately!
  };

  const handleDeleteDocument = async (id: string) => {
    const list = documents.filter(d => d.id !== id);
    setDocuments(list);
    try {
      await apiDeleteDocument(id);
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  // HANDLERS FOR FIELD DISPATCHES
  const handleSaveDispatch = async (dispatch: FieldDispatch) => {
    let list = [...dispatches];
    const existingIndex = dispatches.findIndex(d => d.id === dispatch.id);
    if (existingIndex >= 0) {
      list[existingIndex] = dispatch;
    } else {
      list = [dispatch, ...dispatches];
    }
    setDispatches(list);
    localStorage.setItem('hsc_dispatches', JSON.stringify(list));

    // Update showroom inventory stock levels
    if (existingIndex < 0) {
      // NEW DISPATCH: Deduct issued quantities from available stock
      const updatedProducts = products.map(prod => {
        const item = dispatch.items.find(it => it.productId === prod.id);
        if (item) {
          const updatedProd = {
            ...prod,
            stock: Math.max(0, prod.stock - item.issuedQty)
          };
          apiSaveProduct(updatedProd).catch(() => {});
          return updatedProd;
        }
        return prod;
      });
      setProducts(updatedProducts);
      localStorage.setItem('hsc_products', JSON.stringify(updatedProducts));
    } else if (dispatch.status === 'Completed') {
      // RECONCILED: Return returnedQty back to available stock
      const updatedProducts = products.map(prod => {
        const item = dispatch.items.find(it => it.productId === prod.id);
        if (item && item.returnedQty > 0) {
          const updatedProd = {
            ...prod,
            stock: prod.stock + item.returnedQty
          };
          apiSaveProduct(updatedProd).catch(() => {});
          return updatedProd;
        }
        return prod;
      });
      setProducts(updatedProducts);
      localStorage.setItem('hsc_products', JSON.stringify(updatedProducts));
    }

    try {
      await apiSaveFieldDispatch(dispatch);
    } catch (e) {
      console.warn('Backend sync warning for dispatch:', e);
    }
  };

  const handleDeleteDispatch = async (id: string) => {
    const list = dispatches.filter(d => d.id !== id);
    setDispatches(list);
    localStorage.setItem('hsc_dispatches', JSON.stringify(list));
    try {
      await apiDeleteFieldDispatch(id);
    } catch (e) {
      console.error('Failed to delete dispatch:', e);
    }
  };

  // HANDLER FOR SETTINGS SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(settingsForm);
    try {
      await apiSaveSettings(settingsForm);
      setSettingsSavedFeedback(true);
      setTimeout(() => setSettingsSavedFeedback(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Error saving settings to database.');
    }
  };

  // Quick helper to logout / reset view
  const handleLogout = () => {
    setCurrentView('catalog');
    setViewingDocument(null);
    setEditingDocument(null);
    setIsCreatingDoc(null);
  };

  // Render printable document layout if selected
  if (viewingDocument) {
    return (
      <PrintDocument 
        document={viewingDocument}
        settings={settings}
        onBack={() => setViewingDocument(null)}
      />
    );
  }

  // RENDER MAIN APPLICATION WRAPPERS
  return (
    <div className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen">
      
      {/* 1. PUBLIC WEBSITE CATALOG VIEW */}
      {currentView === 'catalog' && (
        <PublicCatalog 
          products={products}
          onAdminClick={() => {
            if (currentUser) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('login');
            }
          }}
        />
      )}

      {/* 2. ADMIN PORTAL SECURE ACCESS PAGE */}
      {currentView === 'login' && (
        <AdminLogin 
          staffUsers={staffUsers}
          onLoginSuccess={handleLoginUser}
          onBackToCatalog={() => setCurrentView('catalog')}
        />
      )}

      {/* 3. CORE SECURE EXECUTIVE DASHBOARD */}
      {currentView === 'dashboard' && (
        <div className="min-h-screen flex flex-col md:flex-row no-print animate-fade-in">
          
          {/* Dashboard Left Sidebar */}
          <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-950 flex-shrink-0 z-30">
            <div>
              {/* Brand Header */}
              <div className="p-5 border-b border-slate-950 flex items-center justify-center h-16">
                <Logo className="h-full w-auto text-white" light={true} />
              </div>

              {/* Sidebar Tabs Links */}
              <nav className="p-4 space-y-1.5 text-xs font-bold uppercase tracking-wider">
                {/* Switch to Public Link */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all text-left mb-4 font-extrabold cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-rose-500" />
                  Public Website
                </button>

                <div className="text-[10px] text-slate-500 tracking-widest uppercase font-black px-3 pb-2">
                  Management Hub
                </div>

                {/* Tab: Overview */}
                {hasPermission('view_overview') && (
                  <button
                    onClick={() => { setActiveTab('overview'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'overview' && !editingDocument && !isCreatingDoc
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Overview Stats
                  </button>
                )}

                {/* Tab: Inventory */}
                {hasPermission('view_inventory') && (
                  <button
                    onClick={() => { setActiveTab('inventory'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'inventory'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Stock Inventory
                  </button>
                )}

                {/* Tab: Documents */}
                {hasPermission('view_documents') && (
                  <button
                    onClick={() => { setActiveTab('docs'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'docs'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Documents Hub
                  </button>
                )}

                {/* Tab: Reports */}
                {hasPermission('view_reports') && (
                  <button
                    onClick={() => { setActiveTab('reports'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'reports'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Reports Hub
                  </button>
                )}

                {/* Tab: Due Ledger */}
                {hasPermission('view_due_ledger') && (
                  <button
                    onClick={() => { setActiveTab('due_ledger'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'due_ledger'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-rose-400" />
                    Due Ledger
                  </button>
                )}

                {/* Tab: Field Dispatches */}
                {hasPermission('view_field_dispatch') && (
                  <button
                    onClick={() => { setActiveTab('dispatch'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'dispatch'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-amber-400" />
                    Field Dispatches
                  </button>
                )}

                {/* Tab: Company Profiles */}
                {hasPermission('view_company_profiles') && (
                  <button
                    onClick={() => { setActiveTab('company_profiles'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'company_profiles'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-teal-400" />
                    Company Profiles
                  </button>
                )}

                {/* Tab: Staff Sub-Accounts */}
                {hasPermission('view_staff_management') && (
                  <button
                    onClick={() => { setActiveTab('staff_management'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'staff_management'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Staff Sub-Accounts
                  </button>
                )}

                {/* Tab: Business Settings */}
                {hasPermission('manage_settings') && (
                  <button
                    onClick={() => { setActiveTab('settings'); setEditingDocument(null); setIsCreatingDoc(null); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all text-left cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    Showroom Settings
                  </button>
                )}
              </nav>
            </div>

            {/* Sidebar Active User Profile Card */}
            {currentUser && (
              <div className="p-4 border-t border-slate-950 bg-slate-950/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <span className="font-bold text-xs text-white block truncate">{currentUser.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block truncate">{currentUser.designation || currentUser.role}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    currentUser.role === 'ADMIN' ? 'bg-purple-900 text-purple-200 border border-purple-700' : 'bg-blue-900 text-blue-200'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentView('login')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Switch Account
                </button>
              </div>
            )}
          </aside>

          {/* Core workspace content */}
          <main className="flex-1 bg-slate-50 min-h-screen flex flex-col justify-between">
            {/* Top Workspace Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderLock className="w-5 h-5 text-blue-900" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 font-display block">
                    hitachisolutioncenter Workspace
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                    Session: {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Active Session'}
                  </span>
                </div>
              </div>

              {/* Right Side Header Items */}
              <div className="flex items-center gap-3">
                <span className="hidden lg:inline text-xs italic text-blue-900 font-medium font-sans">
                  "Your Problem Solution is Sustainable Partner"
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  Real-Time SQL Live Sync Active
                </div>
              </div>
            </header>

            {/* Render Tab panels */}
            <div className="p-6 md:p-8 flex-1">
              
              {/* Document Creation Forms takes priority */}
              {editingDocument || isCreatingDoc ? (
                <DocumentCreator 
                  products={products}
                  customers={customers}
                  settings={settings}
                  onSaveDocument={handleSaveDocument}
                  onAddCustomer={handleAddCustomer}
                  editingDocument={editingDocument}
                  onCancel={() => { setEditingDocument(null); setIsCreatingDoc(null); }}
                />
              ) : (
                <>
                  {/* TAB PANEL 1: Overview */}
                  {activeTab === 'overview' && hasPermission('view_overview') && (
                    <DashboardOverview 
                      documents={documents}
                      products={products}
                      customers={customers}
                      onNavigateToTab={(tab) => setActiveTab(tab)}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 2: Inventory Stock */}
                  {activeTab === 'inventory' && hasPermission('view_inventory') && (
                    <InventoryManager 
                      products={products}
                      documents={documents}
                      dispatches={dispatches}
                      onAddProduct={handleAddProduct}
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 3: Documents List Log */}
                  {activeTab === 'docs' && hasPermission('view_documents') && (
                    <DocumentList 
                      documents={documents}
                      onAddDocumentClick={(type) => setIsCreatingDoc(type)}
                      onEditDocument={(doc) => setEditingDocument(doc)}
                      onDeleteDocument={handleDeleteDocument}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 4: Reports Hub */}
                  {activeTab === 'reports' && hasPermission('view_reports') && (
                    <ReportsHub 
                      documents={documents}
                      products={products}
                      customers={customers}
                    />
                  )}

                  {/* TAB PANEL 4b: Due Ledger */}
                  {activeTab === 'due_ledger' && hasPermission('view_due_ledger') && (
                    <DueLedger 
                      documents={documents}
                      customers={customers}
                      onUpdateDocument={handleSaveDocument}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 4d: Field Dispatches Movement Hub */}
                  {activeTab === 'dispatch' && hasPermission('view_field_dispatch') && (
                    <FieldDispatchManager 
                      dispatches={dispatches}
                      products={products}
                      customers={customers}
                      staffUsers={staffUsers}
                      settings={settings}
                      onSaveDispatch={handleSaveDispatch}
                      onDeleteDispatch={handleDeleteDispatch}
                      onCreateInvoiceFromDispatch={handleSaveDocument}
                    />
                  )}

                  {/* TAB PANEL 4e: Company Profiles & Unique ID Directory */}
                  {activeTab === 'company_profiles' && hasPermission('view_company_profiles') && (
                    <CompanyProfileManager 
                      customers={customers}
                      documents={documents}
                      dispatches={dispatches}
                      products={products}
                      onSaveCustomer={handleAddCustomer}
                      onViewDocument={(doc) => setViewingDocument(doc)}
                    />
                  )}

                  {/* TAB PANEL 4c: Staff Sub-Accounts & Role Rules */}
                  {activeTab === 'staff_management' && hasPermission('view_staff_management') && (
                    <StaffManagement 
                      staffUsers={staffUsers}
                      currentUser={currentUser}
                      onAddStaff={handleAddStaff}
                      onUpdateStaff={handleUpdateStaff}
                      onDeleteStaff={handleDeleteStaff}
                    />
                  )}

                  {/* TAB PANEL 5: Business Settings Editor */}
                  {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-6">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h3 className="text-sm font-bold text-slate-900 font-display">Manage Showroom Metadata</h3>
                          <p className="text-slate-400 text-[11px] mt-0.5">Customize corporate phone numbers, prefixes, and default print guidelines.</p>
                        </div>

                      <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                        {/* Row 1: Company Name & Slogan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Company Brand Name</label>
                            <input
                              type="text"
                              value={settingsForm.name}
                              onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Corporate Vision Slogan</label>
                            <input
                              type="text"
                              value={settingsForm.slogan}
                              onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Row 2: Address */}
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Office / Showroom Physical Address</label>
                          <textarea
                            rows={2}
                            value={settingsForm.address}
                            onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                          />
                        </div>

                        {/* Row 3: Phones & Contacts */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Direct Hotline 1</label>
                            <input
                              type="text"
                              value={settingsForm.phone1}
                              onChange={(e) => setSettingsForm({ ...settingsForm, phone1: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Direct Hotline 2</label>
                            <input
                              type="text"
                              value={settingsForm.phone2}
                              onChange={(e) => setSettingsForm({ ...settingsForm, phone2: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Corporate Email</label>
                            <input
                              type="email"
                              value={settingsForm.email}
                              onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Row 4: Website & Tax Rate */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="font-bold text-slate-700">Company Website</label>
                            <input
                              type="text"
                              value={settingsForm.website}
                              onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Standard VAT Rate (%)</label>
                            <input
                              type="number"
                              value={settingsForm.taxRate}
                              onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: Number(e.target.value) })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Row 5: Document Number Prefixes */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Offer Letter Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.offerPrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, offerPrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Quotation Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.quotePrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, quotePrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Invoice Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.invoicePrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Bill Prefix</label>
                            <input
                              type="text"
                              value={settingsForm.billPrefix}
                              onChange={(e) => setSettingsForm({ ...settingsForm, billPrefix: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px]"
                            />
                          </div>
                        </div>

                        {/* Default terms and condition block */}
                        <div className="space-y-1 border-t border-slate-100 pt-3">
                          <label className="font-bold text-slate-700">Default Terms & Conditions on Printouts</label>
                          <textarea
                            rows={3}
                            value={settingsForm.terms}
                            onChange={(e) => setSettingsForm({ ...settingsForm, terms: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-mono text-[10px] leading-relaxed"
                          />
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Default Signing Authority Name</label>
                            <input
                              type="text"
                              value={settingsForm.signatureName}
                              onChange={(e) => setSettingsForm({ ...settingsForm, signatureName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Authority Title Designation</label>
                            <input
                              type="text"
                              value={settingsForm.signatureLabel}
                              onChange={(e) => setSettingsForm({ ...settingsForm, signatureLabel: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:outline-hidden font-semibold"
                            />
                          </div>
                        </div>

                        {/* Feedback messages */}
                        {settingsSavedFeedback && (
                          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center">
                            Showroom Settings Saved & Synced Successfully to Cloud SQL.
                          </p>
                        )}

                        <div className="flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => setSettingsForm(settings)}
                            className="px-4 py-2 text-slate-500 font-semibold cursor-pointer"
                          >
                            Reset Form
                          </button>
                          
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            Save & Sync
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* DATABASE RESET / DATA CLEAR CARD */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mt-6 space-y-4">
                      <div className="flex items-center gap-2 text-rose-700 font-bold">
                        <Trash2 className="w-5 h-5" />
                        <h3 className="text-base">Cloud SQL Database & Sample Data Management</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Wipe current sample items, customer lists, and documents from Cloud SQL database to start fresh with clean data entry, or restore original demo data.
                      </p>
                      
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClearAllData}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Data (Start Fresh)
                        </button>

                        <button
                          type="button"
                          onClick={handleRestoreSampleData}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer border border-slate-300"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore Demo Sample Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </>
              )}

            </div>

            {/* Admin page copyright */}
            <footer className="bg-white border-t border-slate-200 py-4 px-8 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              <span>hitachisolutioncenter Dashboard &bull; Cloud SQL Relational Database Active</span>
              <span>"Your Problem Solution is Sustainable Partner"</span>
            </footer>
          </main>
        </div>
      )}

    </div>
  );
}
