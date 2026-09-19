import { useState, Fragment } from 'react';
import { Document, Customer, DocumentStatus } from '../types';
import { 
  DollarSign, 
  Search, 
  Users, 
  Calendar, 
  CreditCard, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert
} from 'lucide-react';

interface DueLedgerProps {
  documents: Document[];
  customers: Customer[];
  onUpdateDocument: (doc: Document) => void;
  onViewDocument: (doc: Document) => void;
}

export default function DueLedger({ documents, customers, onUpdateDocument, onViewDocument }: DueLedgerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'invoices'>('customers');
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  
  // Payment Collection Modal State
  const [collectingDoc, setCollectingDoc] = useState<Document | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Helper: Extract only Invoice & Bill documents
  const financialDocs = documents.filter(doc => doc.type === 'INVOICE' || doc.type === 'BILL');

  // Compute stats
  const totalInvoiced = financialDocs.reduce((sum, doc) => sum + doc.total, 0);
  
  const totalPaid = financialDocs.reduce((sum, doc) => {
    // If explicit paidAmount exists, use it; otherwise if status is 'Paid', use doc.total
    if (doc.paidAmount !== undefined) return sum + doc.paidAmount;
    return doc.status === 'Paid' ? sum + doc.total : sum;
  }, 0);

  const totalOutstanding = financialDocs.reduce((sum, doc) => {
    if (doc.dueAmount !== undefined) return sum + doc.dueAmount;
    return doc.status !== 'Paid' ? sum + doc.total : sum;
  }, 0);

  const overdueOutstanding = financialDocs.reduce((sum, doc) => {
    if (doc.status === 'Overdue') {
      return sum + (doc.dueAmount !== undefined ? doc.dueAmount : doc.total);
    }
    return sum;
  }, 0);

  // Group financial summaries by customer
  const customerLedger = customers.map(cust => {
    const custDocs = financialDocs.filter(d => d.customerId === cust.id);
    
    const invoiced = custDocs.reduce((sum, d) => sum + d.total, 0);
    
    const paid = custDocs.reduce((sum, d) => {
      if (d.paidAmount !== undefined) return sum + d.paidAmount;
      return d.status === 'Paid' ? sum + d.total : sum;
    }, 0);

    const due = custDocs.reduce((sum, d) => {
      if (d.dueAmount !== undefined) return sum + d.dueAmount;
      return d.status !== 'Paid' ? sum + d.total : sum;
    }, 0);

    const overdueCount = custDocs.filter(d => d.status === 'Overdue').length;

    return {
      customer: cust,
      invoiced,
      paid,
      due,
      overdueCount,
      documents: custDocs
    };
  }).filter(item => item.invoiced > 0); // Only show customers with transaction history

  // Filter customer ledger based on search
  const filteredCustomerLedger = customerLedger.filter(item => {
    const term = customerSearch.toLowerCase();
    return (
      item.customer.name.toLowerCase().includes(term) ||
      item.customer.company.toLowerCase().includes(term) ||
      item.customer.phone.includes(term)
    );
  });

  // Filter individual invoices list
  const filteredInvoices = financialDocs.filter(doc => {
    const term = invoiceSearch.toLowerCase();
    const matchesSearch = (
      doc.docNumber.toLowerCase().includes(term) ||
      doc.customerName.toLowerCase().includes(term) ||
      doc.customerCompany.toLowerCase().includes(term)
    );
    return matchesSearch;
  });

  // Handle Payment Form submission
  const handleCollectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingDoc) return;

    // Current values or defaults
    const currentPaid = collectingDoc.paidAmount !== undefined ? collectingDoc.paidAmount : (collectingDoc.status === 'Paid' ? collectingDoc.total : 0);
    const newPaid = Math.min(collectingDoc.total, currentPaid + paymentAmount);
    const newDue = Math.max(0, collectingDoc.total - newPaid);

    let newStatus: DocumentStatus = 'Partially Paid';
    if (newDue === 0) {
      newStatus = 'Paid';
    } else if (newPaid === 0) {
      newStatus = 'Unpaid';
    }

    // Append standard notes if any
    let updatedNotes = collectingDoc.notes || '';
    if (paymentNotes.trim()) {
      const today = new Date().toLocaleDateString('en-GB');
      updatedNotes += `\n[Payment Received: ৳${paymentAmount.toLocaleString()} on ${today} - ${paymentNotes}]`;
    }

    const updatedDoc: Document = {
      ...collectingDoc,
      paidAmount: newPaid,
      dueAmount: newDue,
      status: newStatus,
      notes: updatedNotes
    };

    onUpdateDocument(updatedDoc);
    setCollectingDoc(null);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">Due Outstanding Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5">Monitor accounts receivable, partial payments, and overdue credit balances.</p>
        </div>
        
        {/* Navigation Switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'customers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Ledger
          </button>
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoices & Due Bills
          </button>
        </div>
      </div>

      {/* Receivables Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Total Outstanding
            </span>
            <span className="text-lg font-black text-slate-900 font-display block mt-1">
              ৳{totalOutstanding.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-rose-500 block">Uncollected credit</span>
          </div>
        </div>

        {/* Overdue Receivables */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Overdue Receivables
            </span>
            <span className="text-lg font-black text-rose-700 font-display block mt-1">
              ৳{overdueOutstanding.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-400 block">Passed due dates</span>
          </div>
        </div>

        {/* Collected Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Total Received/Paid
            </span>
            <span className="text-lg font-black text-emerald-700 font-display block mt-1">
              ৳{totalPaid.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-400 block">Out of ৳{totalInvoiced.toLocaleString()}</span>
          </div>
        </div>

        {/* Due Collection Ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Collection Ratio
            </span>
            <span className="text-lg font-black text-blue-900 font-display block mt-1">
              {totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : "0"}%
            </span>
            <span className="text-[9px] font-bold text-emerald-600 block">Total payment clearance</span>
          </div>
        </div>
      </div>

      {/* SUB-PANEL 1: CUSTOMER LEDGER */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger by client name/company..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs focus:outline-hidden transition-all font-semibold"
              />
            </div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Total Managed: {filteredCustomerLedger.length} Accounts
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-950">
                    <th className="py-3 px-5">Client Name & Company</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-right">Total Billing</th>
                    <th className="py-3 px-4 text-right">Collected</th>
                    <th className="py-3 px-4 text-right">Outstanding Due</th>
                    <th className="py-3 px-4 text-center">Overdue</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomerLedger.length > 0 ? (
                    filteredCustomerLedger.map((item) => {
                      const isExpanded = expandedCustomer === item.customer.id;
                      return (
                        <Fragment key={item.customer.id}>
                          <tr 
                            className={`hover:bg-slate-50/80 transition-colors ${item.due > 0 ? 'bg-rose-50/20' : 'bg-white'}`}
                          >
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-900 block">{item.customer.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{item.customer.company}</span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-500">{item.customer.phone}</td>
                            <td className="py-4 px-4 text-right font-bold text-slate-900">৳{item.invoiced.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-bold text-emerald-600">৳{item.paid.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-bold">
                              <span className={item.due > 0 ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100' : 'text-slate-400'}>
                                ৳{item.due.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {item.overdueCount > 0 ? (
                                <span className="bg-rose-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                                  {item.overdueCount} Overdue
                                </span>
                              ) : (
                                <span className="text-slate-300">&mdash;</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-center">
                              <button
                                onClick={() => setExpandedCustomer(isExpanded ? null : item.customer.id)}
                                className="inline-flex items-center gap-1 text-xs text-blue-900 hover:text-blue-950 hover:underline font-bold cursor-pointer"
                              >
                                {isExpanded ? 'Hide Details' : 'View Invoices'}
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail row showing all invoices for the customer */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="bg-slate-50 p-5 border-t border-b border-slate-200">
                                <div className="space-y-3">
                                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Document Audit Trail: {item.customer.name}
                                  </h4>
                                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200">
                                          <th className="py-2.5 px-4">Doc #</th>
                                          <th className="py-2.5 px-4">Date</th>
                                          <th className="py-2.5 px-4">Due Date</th>
                                          <th className="py-2.5 px-4 text-right">Invoiced Total</th>
                                          <th className="py-2.5 px-4 text-right">Paid Amount</th>
                                          <th className="py-2.5 px-4 text-right">Due Amount</th>
                                          <th className="py-2.5 px-4 text-center">Status</th>
                                          <th className="py-2.5 px-4 text-center">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                                        {item.documents.map((doc) => {
                                          const paidAmt = doc.paidAmount !== undefined ? doc.paidAmount : (doc.status === 'Paid' ? doc.total : 0);
                                          const dueAmt = doc.dueAmount !== undefined ? doc.dueAmount : (doc.status !== 'Paid' ? doc.total : 0);
                                          return (
                                            <tr key={doc.id} className="hover:bg-slate-50">
                                              <td className="py-3 px-4 font-mono font-bold text-blue-900">{doc.docNumber}</td>
                                              <td className="py-3 px-4">{doc.date}</td>
                                              <td className="py-3 px-4 font-mono">{doc.dueDate || '--'}</td>
                                              <td className="py-3 px-4 text-right text-slate-900 font-bold">৳{doc.total.toLocaleString()}</td>
                                              <td className="py-3 px-4 text-right text-emerald-600">৳{paidAmt.toLocaleString()}</td>
                                              <td className="py-3 px-4 text-right text-rose-600 font-bold">৳{dueAmt.toLocaleString()}</td>
                                              <td className="py-3 px-4 text-center">
                                                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                  doc.status === 'Paid' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                    : doc.status === 'Partially Paid'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : doc.status === 'Overdue'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                  {doc.status}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4 text-center space-x-2">
                                                <button
                                                  onClick={() => onViewDocument(doc)}
                                                  className="text-blue-900 hover:text-blue-950 font-bold hover:underline text-[10px] cursor-pointer"
                                                >
                                                  View PDF
                                                </button>
                                                {dueAmt > 0 && (
                                                  <button
                                                    onClick={() => {
                                                      setCollectingDoc(doc);
                                                      setPaymentAmount(dueAmt); // Default to full due
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md cursor-pointer"
                                                  >
                                                    Collect
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 px-5 text-center text-slate-400">
                        No customer accounts with transaction history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PANEL 2: INDIVIDUAL INVOICES DUE */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-2xs gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice number or customer name..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs focus:outline-hidden transition-all font-semibold"
              />
            </div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
              Total Records: {filteredInvoices.length} Documents
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-bold border-b border-slate-950">
                    <th className="py-3 px-5">Invoice / Document</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Invoiced Total</th>
                    <th className="py-3 px-4 text-right">Collected</th>
                    <th className="py-3 px-4 text-right">Dues Outstanding</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 text-center">Payment Collect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((doc) => {
                      const paidAmt = doc.paidAmount !== undefined ? doc.paidAmount : (doc.status === 'Paid' ? doc.total : 0);
                      const dueAmt = doc.dueAmount !== undefined ? doc.dueAmount : (doc.status !== 'Paid' ? doc.total : 0);
                      return (
                        <tr 
                          key={doc.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${dueAmt > 0 ? 'bg-rose-50/10' : 'bg-white'}`}
                        >
                          <td className="py-4 px-5">
                            <span className="font-mono font-bold text-blue-900 block text-xs">{doc.docNumber}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{doc.type}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900 block">{doc.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{doc.customerCompany}</span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{doc.date}</td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{doc.dueDate || '--'}</td>
                          <td className="py-4 px-4 text-right font-bold text-slate-900">৳{doc.total.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right font-bold text-emerald-600">৳{paidAmt.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right font-bold text-rose-600">
                            <span className={dueAmt > 0 ? 'bg-rose-50 border border-rose-100 px-2 py-1 rounded-md' : 'text-slate-400'}>
                              ৳{dueAmt.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              doc.status === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : doc.status === 'Partially Paid'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : doc.status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => onViewDocument(doc)}
                                className="text-slate-400 hover:text-blue-950 font-bold p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="View Document Layout"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              {dueAmt > 0 ? (
                                <button
                                  onClick={() => {
                                    setCollectingDoc(doc);
                                    setPaymentAmount(dueAmt);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                                >
                                  Collect
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                  <CheckCircle className="w-3.5 h-3.5" /> Fully Paid
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 px-5 text-center text-slate-400">
                        No sales invoices or customer purchase bills recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE PAYMENT MODAL */}
      {collectingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Payment Desk</span>
                <h3 className="font-extrabold font-display text-sm">Collect Outstanding Dues</h3>
              </div>
              <button 
                onClick={() => setCollectingDoc(null)}
                className="text-slate-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg text-xs"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1.5">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Document #</span>
                  <span className="font-mono font-bold text-slate-900">{collectingDoc.docNumber}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Customer Name</span>
                  <span className="font-bold text-slate-950">{collectingDoc.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Invoiced Total</span>
                  <span className="font-bold text-slate-900">৳{collectingDoc.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Previously Paid</span>
                  <span className="font-bold text-emerald-600">
                    ৳{(collectingDoc.paidAmount !== undefined ? collectingDoc.paidAmount : (collectingDoc.status === 'Paid' ? collectingDoc.total : 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-slate-800 font-bold">
                  <span>Outstanding Balance</span>
                  <span className="text-rose-600 font-extrabold">
                    ৳{(collectingDoc.dueAmount !== undefined ? collectingDoc.dueAmount : (collectingDoc.status !== 'Paid' ? collectingDoc.total : 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Receive Payment Input */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Receive Collection Amount (৳) <span className="text-rose-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base font-display">৳</span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={collectingDoc.dueAmount !== undefined ? collectingDoc.dueAmount : collectingDoc.total}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-7 focus:bg-white focus:outline-hidden font-bold text-slate-900 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Enter payment collected from the client. Maximum allowed is the outstanding due amount.</p>
              </div>

              {/* Payment Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Payment / Transaction Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Received via Bank Cheque #48104 or Cash"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingDoc(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-700 text-center rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
