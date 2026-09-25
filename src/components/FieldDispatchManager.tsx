import { useState, useMemo } from 'react';
import { FieldDispatch, FieldDispatchItem, Product, Customer, StaffUser, BusinessSettings, Document } from '../types';
import { 
  Truck, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Printer, 
  Trash2, 
  UserCheck, 
  X, 
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';
import Logo from './Logo';

interface FieldDispatchManagerProps {
  dispatches: FieldDispatch[];
  products: Product[];
  customers: Customer[];
  staffUsers: StaffUser[];
  settings: BusinessSettings;
  onSaveDispatch: (dispatch: FieldDispatch) => Promise<void>;
  onDeleteDispatch: (id: string) => Promise<void>;
  onCreateInvoiceFromDispatch: (doc: Document) => Promise<void>;
}

export default function FieldDispatchManager({
  dispatches,
  products,
  customers,
  staffUsers,
  settings,
  onSaveDispatch,
  onDeleteDispatch,
  onCreateInvoiceFromDispatch,
}: FieldDispatchManagerProps) {
  // Navigation & Modal States
  const [isCreating, setIsCreating] = useState(false);
  const [reconcilingDispatch, setReconcilingDispatch] = useState<FieldDispatch | null>(null);
  const [printingDispatch, setPrintingDispatch] = useState<FieldDispatch | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('All');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // NEW DISPATCH FORM STATE
  const [formStaffId, setFormStaffId] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formPurpose, setFormPurpose] = useState('On-site Maintenance & Sales Demo');
  const [formDispatchDate, setFormDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<FieldDispatchItem[]>([]);

  // RECONCILIATION FORM STATE
  const [reconcileItems, setReconcileItems] = useState<FieldDispatchItem[]>([]);
  const [reconcileDate, setReconcileDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [autoGenerateInvoice, setAutoGenerateInvoice] = useState(true);

  // Form helper: Add Item to New Dispatch Slip
  const handleAddItemToDispatch = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Check if already added
    const exists = formItems.some(item => item.productId === productId);
    if (exists) return;

    const newItem: FieldDispatchItem = {
      id: `disp-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: prod.id,
      productName: prod.name,
      brand: prod.brand,
      unit: prod.unit || 'Pcs',
      issuedQty: 1,
      soldQty: 0,
      returnedQty: 0,
      unitPrice: prod.price,
      totalPrice: prod.price
    };

    setFormItems([...formItems, newItem]);
  };

  const handleUpdateItemQty = (id: string, qty: number) => {
    setFormItems(formItems.map(item => {
      if (item.id === id) {
        const validQty = Math.max(1, qty);
        return {
          ...item,
          issuedQty: validQty,
          totalPrice: validQty * item.unitPrice
        };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setFormItems(formItems.filter(item => item.id !== id));
  };

  // Submit New Dispatch Creation (Fallback defaults ensure work completes smoothly)
  const handleCreateDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const staff = staffUsers.find(s => s.id === formStaffId) || staffUsers[0] || {
      id: 'staff-master',
      name: 'MD MAHI UDDIN'
    };

    const cust = customers.find(c => c.id === formCustomerId) || customers[0] || {
      id: 'cust-general',
      name: 'Walk-in Client / কাস্টমার',
      company: 'General Company / ক্লায়েন্ট',
      phone: '01700-000000'
    };

    let itemsToIssue = formItems;
    if (itemsToIssue.length === 0 && products.length > 0) {
      const p = products[0];
      itemsToIssue = [{
        id: `disp-item-${Date.now()}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        unit: p.unit || 'Pcs',
        issuedQty: 1,
        soldQty: 0,
        returnedQty: 0,
        unitPrice: p.price,
        totalPrice: p.price
      }];
    }

    // Generate unique dispatch number e.g. DISP/2026/0005
    const seq = dispatches.length + 1;
    const dispatchNumber = `DISP/2026/${String(seq).padStart(4, '0')}`;

    const newDispatch: FieldDispatch = {
      id: `disp-${Date.now()}`,
      dispatchNumber,
      staffId: staff.id,
      staffName: staff.name,
      customerId: cust.id,
      customerName: cust.name,
      customerCompany: cust.company || cust.name,
      customerPhone: cust.phone,
      purpose: formPurpose || 'On-site Service & Trial',
      dispatchDate: formDispatchDate || new Date().toISOString().split('T')[0],
      returnDate: null,
      status: 'Pending Return',
      notes: formNotes,
      items: itemsToIssue
    };

    await onSaveDispatch(newDispatch);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setFormStaffId('');
    setFormCustomerId('');
    setFormPurpose('On-site Maintenance & Sales Demo');
    setFormDispatchDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormItems([]);
  };

  // OPEN RECONCILIATION MODAL
  const handleOpenReconcileModal = (disp: FieldDispatch) => {
    setReconcilingDispatch(disp);
    setReconcileItems(disp.items.map(it => ({
      ...it,
      soldQty: it.soldQty || 0,
      returnedQty: it.returnedQty || (it.issuedQty - (it.soldQty || 0))
    })));
    setReconcileDate(new Date().toISOString().split('T')[0]);
    setReconcileNotes(disp.notes || '');
  };

  // Update Sold/Returned quantities during reconciliation
  const handleUpdateReconcileSoldQty = (itemId: string, soldQty: number) => {
    setReconcileItems(reconcileItems.map(item => {
      if (item.id === itemId) {
        const validSold = Math.min(item.issuedQty, Math.max(0, soldQty));
        const returned = item.issuedQty - validSold;
        return {
          ...item,
          soldQty: validSold,
          returnedQty: returned,
          totalPrice: validSold * item.unitPrice
        };
      }
      return item;
    }));
  };

  // SUBMIT RECONCILIATION
  const handleSaveReconciliation = async () => {
    if (!reconcilingDispatch) return;

    const updatedDispatch: FieldDispatch = {
      ...reconcilingDispatch,
      returnDate: reconcileDate,
      status: 'Completed',
      notes: reconcileNotes,
      items: reconcileItems
    };

    await onSaveDispatch(updatedDispatch);

    // If auto generate sales invoice for sold items
    const totalSoldItems = reconcileItems.reduce((sum, it) => sum + it.soldQty, 0);
    if (autoGenerateInvoice && totalSoldItems > 0) {
      const soldDocumentItems = reconcileItems
        .filter(it => it.soldQty > 0)
        .map((it, idx) => ({
          id: `inv-item-${idx}-${Date.now()}`,
          productId: it.productId,
          name: it.productName,
          brand: it.brand,
          quantity: it.soldQty,
          price: it.unitPrice,
          total: it.soldQty * it.unitPrice,
          unit: it.unit
        }));

      const subtotal = soldDocumentItems.reduce((sum, it) => sum + it.total, 0);
      const taxAmount = Math.round((subtotal * settings.taxRate) / 100);
      const total = subtotal + taxAmount;

      const cust = customers.find(c => c.id === reconcilingDispatch.customerId);

      const newInvoice: Document = {
        id: `doc-${Date.now()}`,
        type: 'INVOICE',
        docNumber: `${settings.invoicePrefix || 'JM/INV/2026/'}${Math.floor(1000 + Math.random() * 9000)}`,
        date: reconcileDate,
        dueDate: reconcileDate,
        customerId: reconcilingDispatch.customerId,
        customerName: reconcilingDispatch.customerName,
        customerCompany: reconcilingDispatch.customerCompany,
        customerPhone: reconcilingDispatch.customerPhone,
        customerEmail: cust?.email || '',
        customerAddress: cust?.address || '',
        items: soldDocumentItems,
        subtotal,
        taxRate: settings.taxRate,
        taxAmount,
        discount: 0,
        total,
        paidAmount: 0,
        dueAmount: total,
        status: 'Unpaid',
        terms: settings.terms || '',
        notes: `Automatically generated from Field Dispatch Slip #${reconcilingDispatch.dispatchNumber} (Handled by ${reconcilingDispatch.staffName})`,
        signatureName: settings.signatureName || 'MD MAHI UDDIN',
        signatureLabel: settings.signatureLabel || 'Managing Director'
      };

      await onCreateInvoiceFromDispatch(newInvoice);
      alert(`Reconciliation saved! Invoice #${newInvoice.docNumber} has been generated for ৳${total.toLocaleString()}`);
    } else {
      alert("Field Dispatch reconciliation saved successfully.");
    }

    setReconcilingDispatch(null);
  };

  // Filtered List
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      const matchStaff = selectedStaffFilter === 'All' || d.staffId === selectedStaffFilter;
      const matchCustomer = selectedCustomerFilter === 'All' || d.customerId === selectedCustomerFilter;
      const matchStatus = selectedStatusFilter === 'All' || d.status === selectedStatusFilter;
      const matchSearch = d.dispatchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStaff && matchCustomer && matchStatus && matchSearch;
    });
  }, [dispatches, selectedStaffFilter, selectedCustomerFilter, selectedStatusFilter, searchQuery]);

  // Overall KPI stats
  const kpis = useMemo(() => {
    const pending = dispatches.filter(d => d.status === 'Pending Return');
    const completed = dispatches.filter(d => d.status === 'Completed');

    let totalIssued = 0;
    let totalSold = 0;
    let totalReturned = 0;

    dispatches.forEach(d => {
      d.items.forEach(it => {
        totalIssued += it.issuedQty;
        totalSold += (it.soldQty || 0);
        totalReturned += (it.returnedQty || 0);
      });
    });

    return {
      totalDispatches: dispatches.length,
      pendingCount: pending.length,
      completedCount: completed.length,
      totalIssued,
      totalSold,
      totalReturned
    };
  }, [dispatches]);

  // RENDER PRINTABLE DISPATCH CHALLAN SLIP
  if (printingDispatch) {
    return (
      <div className="bg-slate-100 min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-white border border-slate-300 rounded-2xl shadow-xl p-8 space-y-6 printable-area">
          
          {/* Header Buttons */}
          <div className="no-print flex justify-between items-center border-b border-slate-200 pb-4">
            <button
              onClick={() => setPrintingDispatch(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              &larr; Back to Field Movement Hub
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF Challan
            </button>
          </div>

          {/* Business Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <Logo className="h-12 w-auto text-blue-950" />
              <p className="text-xs font-extrabold text-blue-900">{settings.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">{settings.slogan}</p>
              <p className="text-[10px] text-slate-500">{settings.address}</p>
              <p className="text-[10px] text-slate-500">Phone: {settings.phone1}, {settings.phone2} &bull; Email: {settings.email}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="bg-blue-900 text-white font-extrabold text-xs px-3 py-1 rounded-md uppercase tracking-wider block">
                FIELD ISSUE & DISPATCH SLIP
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 pt-2">Challan No: {printingDispatch.dispatchNumber}</p>
              <p className="text-[11px] text-slate-500 font-semibold">Issue Date: {printingDispatch.dispatchDate}</p>
              {printingDispatch.returnDate && (
                <p className="text-[11px] text-emerald-700 font-semibold">Reconciled Date: {printingDispatch.returnDate}</p>
              )}
            </div>
          </div>

          {/* Details Metadata */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Staff Representative:</p>
              <p className="font-bold text-slate-900 text-sm">{printingDispatch.staffName}</p>
              <p className="text-[11px] text-slate-600">Issued for Field Operations & Service</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Destination Client / Company:</p>
              <p className="font-bold text-slate-900 text-sm">{printingDispatch.customerCompany || printingDispatch.customerName}</p>
              <p className="text-[11px] text-slate-600">Attn: {printingDispatch.customerName} ({printingDispatch.customerPhone})</p>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-700">Purpose / Work Description:</p>
            <p className="text-slate-600 italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">{printingDispatch.purpose}</p>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Issued Machinery & Spare Parts List:</h4>
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-700 text-[11px] uppercase">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Product Name / Model</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3 text-center">Issued Out</th>
                  <th className="p-3 text-center">Sold/Used</th>
                  <th className="p-3 text-center">Returned</th>
                  <th className="p-3 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {printingDispatch.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                    <td className="p-3">{item.brand}</td>
                    <td className="p-3 text-center font-extrabold text-blue-900 bg-blue-50/50">{item.issuedQty} {item.unit}</td>
                    <td className="p-3 text-center font-bold text-emerald-700">{item.soldQty || 0} {item.unit}</td>
                    <td className="p-3 text-center font-bold text-slate-600">{item.returnedQty || 0} {item.unit}</td>
                    <td className="p-3 text-right font-mono">৳{item.unitPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {printingDispatch.notes && (
            <div className="text-xs space-y-1 border-t border-slate-100 pt-3">
              <p className="font-bold text-slate-700">Dispatch Notes / Field Remarks:</p>
              <p className="text-slate-600">{printingDispatch.notes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-16 text-center text-xs font-bold text-slate-700">
            <div className="border-t border-slate-400 pt-2">
              <p>Store Keeper Signature</p>
              <p className="text-[10px] text-slate-400 font-normal">Jubayer Machineries</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p>Staff Representative</p>
              <p className="text-[10px] text-slate-400 font-normal">{printingDispatch.staffName}</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p>Client Receiving Rep</p>
              <p className="text-[10px] text-slate-400 font-normal">{printingDispatch.customerCompany}</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
            Internal Movement Document &bull; hitachisolutioncenter Dispatch Tracking
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-xs">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-blue-200 text-[10px] font-bold uppercase tracking-wider border border-blue-700">
            <Truck className="w-3.5 h-3.5 text-blue-300" />
            Field Movement & Dispatch Tracker (ফিল্ড মুভমেন্ট ও সার্ভিস চালানের হিসাব)
          </div>
          <h2 className="text-xl font-black font-display tracking-tight text-white">
            Staff Product Movement & Field Reconciliation Hub
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl">
            Track spare parts and machinery issued to field engineers for customer site service, trial demos, and sales trips. Reconcile returns and auto-issue sales invoices.
          </p>
        </div>

        <button
          onClick={() => { setIsCreating(true); resetForm(); }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          + নতুন ডিসপ্যাচ চালান তৈরি করুন
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Pending Dispatches</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-display text-slate-900">
            {kpis.pendingCount} <span className="text-xs font-semibold text-slate-500">Challans</span>
          </div>
          <p className="text-[10px] text-amber-600 font-bold">মাঠে রয়েছে (Pending Return)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Items Issued</span>
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-display text-blue-950">
            {kpis.totalIssued} <span className="text-xs font-semibold text-slate-500">Units</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">শোরুম থেকে বাইরে নিয়ে যাওয়া মোট মালামাল</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Field Sold / Installed</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-display text-emerald-700">
            {kpis.totalSold} <span className="text-xs font-semibold text-slate-500">Units</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold">অন-সাইটে সরাসরি ব্যবহৃত/বিক্রিত</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Returned To Warehouse</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-display text-purple-900">
            {kpis.totalReturned} <span className="text-xs font-semibold text-slate-500">Units</span>
          </div>
          <p className="text-[10px] text-purple-700 font-bold">শোরুমে অক্ষত ফেরত জমা মালামাল</p>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search challan #, staff, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-semibold"
            />
          </div>

          {/* Staff Filter */}
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
          >
            <option value="All">সকল স্টাফ (All Staff)</option>
            {staffUsers.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.designation || s.role})</option>
            ))}
          </select>

          {/* Customer Company Filter */}
          <select
            value={selectedCustomerFilter}
            onChange={(e) => setSelectedCustomerFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
          >
            <option value="All">সকল কোম্পানি (All Clients)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.company || c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
          >
            <option value="All">সকল স্টেটাস (All Status)</option>
            <option value="Pending Return">Pending Return (মাঠে রয়েছে)</option>
            <option value="Completed">Completed (ফেরত হিসাব সম্পন্ন)</option>
            <option value="Cancelled">Cancelled (বাতিল)</option>
          </select>
        </div>

        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Total Found: {filteredDispatches.length} Challans
        </span>
      </div>

      {/* DISPATCHES TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900 font-display">Field Dispatch Challans Log</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Real-Time Cloud Sync Active</span>
        </div>

        {filteredDispatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Challan #</th>
                  <th className="p-4">Dispatch Date</th>
                  <th className="p-4">Responsible Staff</th>
                  <th className="p-4">Client Company</th>
                  <th className="p-4">Purpose / Purpose</th>
                  <th className="p-4 text-center">Items (Issued / Sold / Returned)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {filteredDispatches.map(disp => {
                  const totalIssued = disp.items.reduce((s, it) => s + it.issuedQty, 0);
                  const totalSold = disp.items.reduce((s, it) => s + (it.soldQty || 0), 0);
                  const totalReturned = disp.items.reduce((s, it) => s + (it.returnedQty || 0), 0);

                  return (
                    <tr key={disp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-blue-900">{disp.dispatchNumber}</td>
                      <td className="p-4 text-slate-500 font-medium">{disp.dispatchDate}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="font-bold text-slate-900">{disp.staffName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-bold text-slate-900">{disp.customerCompany || disp.customerName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block pl-5">{disp.customerPhone}</span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">{disp.purpose}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl text-xs">
                          <span className="text-blue-900 font-black" title="Issued Out">
                            {totalIssued} Issued
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-emerald-700 font-bold" title="Sold/Used">
                            {totalSold} Sold
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-purple-700 font-bold" title="Returned">
                            {totalReturned} Ret
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {disp.status === 'Pending Return' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending Return
                          </span>
                        ) : disp.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {disp.status === 'Pending Return' && (
                            <button
                              onClick={() => handleOpenReconcileModal(disp)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              রিটার্ন এন্ট্রি করুন
                            </button>
                          )}

                          <button
                            onClick={() => setPrintingDispatch(disp)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-300"
                          >
                            <Printer className="w-3 h-3" />
                            Challan Slip
                          </button>

                          <button
                            onClick={() => {
                              if (confirm("Delete this field dispatch record?")) onDeleteDispatch(disp.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700">No Field Dispatches Found</h4>
            <p className="text-slate-400 text-xs">Click "+ নতুন ডিসপ্যাচ চালান তৈরি করুন" to register a new staff product movement.</p>
          </div>
        )}
      </div>

      {/* CREATE DISPATCH MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-blue-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block">Outward Field Movement</span>
                <h3 className="text-base font-bold font-display">নতুন ডিসপ্যাচ চালান তৈরি করুন (New Field Issue Slip)</h3>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDispatchSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              
              {/* Staff & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">মালামাল বহনকারী স্টাফ (Responsible Staff) <span className="text-rose-600">*</span></label>
                  <select
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 font-semibold text-slate-900"
                  >
                    <option value="">&mdash; Select Staff Member &mdash;</option>
                    {staffUsers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.designation || s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">গ্রাহক / ক্লায়েন্ট কোম্পানি (Destination Client)</label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 font-semibold text-slate-900"
                  >
                    <option value="">&mdash; Walk-in Client / সাধারণ কাস্টমার &mdash;</option>
                    {customers.map(c => {
                      const compId = c.companyId || `COMP-${c.id.replace('cust-', '100')}`;
                      return (
                        <option key={c.id} value={c.id}>
                          [{compId}] {c.company || c.name} ({c.name})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Purpose & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-700 block">উদ্দেশ্য / কারণ (Purpose of Field Issue)</label>
                  <input
                    type="text"
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="e.g. On-site Screw Compressor Maintenance & Spare Replacement"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">চালান তারিখ (Date)</label>
                  <input
                    type="date"
                    value={formDispatchDate}
                    onChange={(e) => setFormDispatchDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>

              {/* Product Selector Dropdown */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-800">ইস্যুকৃত পণ্য নির্বাচন করুন (Select Products to Issue)</label>
                  <span className="text-[10px] text-slate-400">Clicking product adds 1 unit</span>
                </div>
                
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItemToDispatch(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl p-3 font-semibold text-blue-950 cursor-pointer"
                >
                  <option value="">+ Add Product Item from Inventory Stock...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand}) &mdash; Stock Available: {p.stock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Added Items Table */}
              {formItems.length > 0 && (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Dispatched Items List:</h4>
                  <div className="space-y-2">
                    {formItems.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      const currentStock = prod ? prod.stock : 0;

                      return (
                        <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <span className="font-bold text-slate-900 block">{item.productName}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{item.brand} &bull; Available in Warehouse: {currentStock} {item.unit}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-600 text-[10px]">Issued Qty:</span>
                              <input
                                type="number"
                                min={1}
                                max={currentStock}
                                value={item.issuedQty}
                                onChange={(e) => handleUpdateItemQty(item.id, Number(e.target.value))}
                                className="w-16 p-1.5 bg-slate-100 border border-slate-300 rounded-md font-bold text-center text-xs"
                              />
                              <span className="text-slate-500 font-semibold">{item.unit}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">নোট বা বিশেষ নির্দেশনা (Dispatch Notes)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Taking 2 units for Apex Textile service. 1 unit intended for install, 1 for standby..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase rounded-xl shadow-md cursor-pointer"
                >
                  চালান ইস্যু করুন (Issue Dispatch)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECONCILIATION MODAL */}
      {reconcilingDispatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">Reconciliation & Stock Return</span>
                <h3 className="text-base font-bold font-display">রিটার্ন এন্ট্রি ও এডজাস্টমেন্ট হিসাব ({reconcilingDispatch.dispatchNumber})</h3>
              </div>
              <button onClick={() => setReconcilingDispatch(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Staff Member:</span>
                  <span className="font-bold text-slate-900 text-sm block">{reconcilingDispatch.staffName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Client Company:</span>
                  <span className="font-bold text-slate-900 text-sm block">{reconcilingDispatch.customerCompany}</span>
                </div>
              </div>

              {/* Items Reconciliation Inputs */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  ইস্যুকৃত মালামালের ফলাফল এন্ট্রি করুন (Reconcile Quantities):
                </h4>

                <div className="space-y-3">
                  {reconcileItems.map(item => (
                    <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">{item.productName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.brand}</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-900 font-extrabold rounded-lg text-xs">
                          Issued Out: {item.issuedQty} {item.unit}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="font-bold text-emerald-800 block">অন-সাইটে বিক্রিত/ব্যবহৃত (Sold Qty):</label>
                          <input
                            type="number"
                            min={0}
                            max={item.issuedQty}
                            value={item.soldQty}
                            onChange={(e) => handleUpdateReconcileSoldQty(item.id, Number(e.target.value))}
                            className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg font-extrabold text-emerald-900 text-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-purple-800 block">অফিসে ফেরত জমা (Returned Qty):</label>
                          <div className="p-2 bg-purple-50 border border-purple-300 rounded-lg font-extrabold text-purple-900 text-center">
                            {item.returnedQty} {item.unit}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Option to Auto-Generate Sales Invoice */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-950 text-xs">
                  <input
                    type="checkbox"
                    checked={autoGenerateInvoice}
                    onChange={(e) => setAutoGenerateInvoice(e.target.checked)}
                    className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
                  />
                  অন-সাইটে বিক্রিত পণ্যগুলোর জন্য ক্লায়েন্টের নামে সরাসরি সেলস ইনভয়েস (Sales Invoice) তৈরি করুন
                </label>
                <p className="text-[10px] text-slate-500 pl-6 leading-relaxed">
                  যদি চেক করা থাকে, তবে অন-সাইটে বিক্রিত পার্টসের জন্য {reconcilingDispatch.customerCompany}-এর নামে স্বয়ংক্রিয়ভাবে ইনভয়েস তৈরি হয়ে ইনভয়েস তালিকায় যুক্ত হবে।
                </p>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ফেরত ও নিষ্পত্তির তারিখ</label>
                  <input
                    type="date"
                    value={reconcileDate}
                    onChange={(e) => setReconcileDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">রিটার্ন নোটস (Remarks)</label>
                  <input
                    type="text"
                    value={reconcileNotes}
                    onChange={(e) => setReconcileNotes(e.target.value)}
                    placeholder="e.g. 1 unit installed at plant, 1 unit returned intact to stock."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReconcilingDispatch(null)}
                  className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReconciliation}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase rounded-xl shadow-md cursor-pointer"
                >
                  হিসাব সংরক্ষণ ও রিটার্ন সম্পন্ন করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
