import { useState, useMemo } from 'react';
import { Document, Product, Customer } from '../types';
import { Download, Users, ShoppingBag, DollarSign, Calendar, BarChart3, ArrowDown } from 'lucide-react';

interface ReportsHubProps {
  documents: Document[];
  products: Product[];
  customers: Customer[];
}

export default function ReportsHub({ documents, products, customers }: ReportsHubProps) {
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'customer' | 'product'>('sales');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  // unique brands list
  const brands = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.brand)))];
  }, [products]);

  // Aggregate Sales Figures
  const salesMetrics = useMemo(() => {
    const invoices = documents.filter(d => d.type === 'INVOICE');
    const totalSalesValue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
    const totalTaxValue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.taxAmount, 0);
    const outstandingValue = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').reduce((sum, i) => sum + i.total, 0);
    const draftValue = invoices.filter(i => i.status === 'Draft').reduce((sum, i) => sum + i.total, 0);

    return {
      totalSalesValue,
      totalTaxValue,
      outstandingValue,
      draftValue,
      totalInvoicesCount: invoices.length,
      paidCount: invoices.filter(i => i.status === 'Paid').length,
      unpaidCount: invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').length
    };
  }, [documents]);

  // Customer-based transactional details
  const customerSummary = useMemo(() => {
    return customers.map(cust => {
      const clientDocs = documents.filter(d => d.customerId === cust.id);
      const invoiceDocs = clientDocs.filter(d => d.type === 'INVOICE');
      const paidAmt = invoiceDocs.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
      const pendingAmt = invoiceDocs.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').reduce((sum, i) => sum + i.total, 0);
      const quotesCount = clientDocs.filter(d => d.type === 'QUOTATION').length;
      const offersCount = clientDocs.filter(d => d.type === 'OFFER_LETTER').length;

      return {
        ...cust,
        totalDocsCount: clientDocs.length,
        paidAmt,
        pendingAmt,
        quotesCount,
        offersCount
      };
    });
  }, [documents, customers]);

  // Product sales details
  const productSalesSummary = useMemo(() => {
    // Tally up items sold across paid and sent invoices
    const soldQuantities: Record<string, number> = {};
    const soldAmounts: Record<string, number> = {};

    documents
      .filter(d => d.type === 'INVOICE' && d.status === 'Paid')
      .forEach(doc => {
        doc.items.forEach(item => {
          if (item.productId) {
            soldQuantities[item.productId] = (soldQuantities[item.productId] || 0) + item.quantity;
            soldAmounts[item.productId] = (soldAmounts[item.productId] || 0) + item.total;
          }
        });
      });

    return products.map(prod => {
      const qtySold = soldQuantities[prod.id] || 0;
      const totalRevenue = soldAmounts[prod.id] || 0;
      return {
        ...prod,
        qtySold,
        totalRevenue
      };
    });
  }, [documents, products]);

  // Filtered lists for rendering
  const displayedCustomerReport = useMemo(() => {
    if (selectedCustomerId === 'All') return customerSummary;
    return customerSummary.filter(c => c.id === selectedCustomerId);
  }, [customerSummary, selectedCustomerId]);

  const displayedProductReport = useMemo(() => {
    if (selectedBrand === 'All') return productSalesSummary;
    return productSalesSummary.filter(p => p.brand === selectedBrand);
  }, [productSalesSummary, selectedBrand]);

  // CLIENT-SIDE DOWNLOAD DYNAMIC CSV GENERATOR
  const downloadCSV = (reportType: 'sales' | 'customers' | 'products') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `hitachisolutioncenter-${reportType}-Report.csv`;

    if (reportType === 'sales') {
      csvContent += "Metric Label,Value (BDT / Count)\n";
      csvContent += `Total Sales Revenue (Paid Invoices),৳${salesMetrics.totalSalesValue}\n`;
      csvContent += `Total VAT/Tax Collected,৳${salesMetrics.totalTaxValue}\n`;
      csvContent += `Outstanding Receivables (Unpaid),৳${salesMetrics.outstandingValue}\n`;
      csvContent += `Draft Invoices Value,৳${salesMetrics.draftValue}\n`;
      csvContent += `Total Billing Invoice Count,${salesMetrics.totalInvoicesCount}\n`;
      csvContent += `Cleared Invoices,${salesMetrics.paidCount}\n`;
      csvContent += `Outstanding Invoices,${salesMetrics.unpaidCount}\n`;
    } else if (reportType === 'customers') {
      csvContent += "Customer Company,Contact Name,Phone,Email,Total Documents,Total Paid (BDT),Pending Amount (BDT),Quotes Sent,Offers Drafted\n";
      customerSummary.forEach(c => {
        csvContent += `"${c.company || 'Private'}","${c.name}","${c.phone}","${c.email}",${c.totalDocsCount},${c.paidAmt},${c.pendingAmt},${c.quotesCount},${c.offersCount}\n`;
      });
    } else if (reportType === 'products') {
      csvContent += "SKU,Product Name,Category,Brand,Standard Unit Price (BDT),Available Stock,Quantity Sold,Revenue Generated (BDT)\n";
      productSalesSummary.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.category}","${p.brand}",${p.price},${p.stock},${p.qtySold},${p.totalRevenue}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Upper Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200 gap-1 self-start">
          <button
            onClick={() => setActiveReportTab('sales')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors ${
              activeReportTab === 'sales'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Reports
          </button>
          
          <button
            onClick={() => setActiveReportTab('customer')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors ${
              activeReportTab === 'customer'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer-Based Reports
          </button>

          <button
            onClick={() => setActiveReportTab('product')}
            className={`px-4 py-2 font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors ${
              activeReportTab === 'product'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Product Stock Reports
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={() => downloadCSV(activeReportTab === 'sales' ? 'sales' : activeReportTab === 'customer' ? 'customers' : 'products')}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Download className="w-4.5 h-4.5" />
          Download CSV Spreadsheet
        </button>
      </div>

      {/* RENDER DYNAMIC TAB CONTENT */}

      {/* Tab 1: Sales Summary & Trends */}
      {activeReportTab === 'sales' && (
        <div className="space-y-6 animate-fade-in">
          {/* Subheader summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-800 space-y-1.5">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Cleared Sales Revenue</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">৳{salesMetrics.totalSalesValue.toLocaleString()}</h4>
              <p className="text-[10px] text-emerald-600/70 font-semibold">From {salesMetrics.paidCount} paid invoice receipts</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 space-y-1.5">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-amber-600">Outstanding Receivables</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">৳{salesMetrics.outstandingValue.toLocaleString()}</h4>
              <p className="text-[10px] text-amber-600/70 font-semibold">From {salesMetrics.unpaidCount} unpaid/overdue invoices</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-blue-800 space-y-1.5">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Tax / VAT Collected</span>
              </div>
              <h4 className="text-xl font-extrabold font-display">৳{salesMetrics.totalTaxValue.toLocaleString()}</h4>
              <p className="text-[10px] text-blue-600/70 font-semibold">Average 5% brand tax on completed billing</p>
            </div>
          </div>

          {/* Breakdown Detail Block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">Operational Sales Summary Log</h3>
            
            <div className="border border-slate-150 rounded-xl overflow-hidden font-sans">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Financial Metric Item</th>
                    <th className="py-3 px-4 text-right">Aggregate Balance / Volume</th>
                    <th className="py-3 px-4">Performance Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Total Invoice Billing Volume</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-display">৳{(salesMetrics.totalSalesValue + salesMetrics.outstandingValue).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">All completed & outstanding client transactions</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Completed Payments Received</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700 font-display">৳{salesMetrics.totalSalesValue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fully Cleared BDT Balance
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Uncollected Customer Outstanding</td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-700 font-display">৳{salesMetrics.outstandingValue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">Accounts Receivable pending showroom review</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Active Pipeline Quotes</td>
                    <td className="py-3 px-4 text-right font-extrabold text-blue-900 font-display">
                      {documents.filter(d => d.type === 'QUOTATION' && d.status === 'Sent').length} items
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">Quotations awaiting final customer purchase order</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Customer-Based Reports */}
      {activeReportTab === 'customer' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters */}
          <div className="flex bg-white border border-slate-200 p-4 rounded-xl items-center gap-3 shadow-2xs">
            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Filter Customer:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Registered Clients</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company || c.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company & Client Info</th>
                  <th className="py-3.5 px-3">Contact Directs</th>
                  <th className="py-3.5 px-3 text-center">Docs Volume</th>
                  <th className="py-3.5 px-3 text-right">Total Paid</th>
                  <th className="py-3.5 px-3 text-right">Outstanding Amount</th>
                  <th className="py-3.5 px-3 text-center">Inquiry Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCustomerReport.length > 0 ? (
                  displayedCustomerReport.map(c => {
                    const hasOutstanding = c.pendingAmt > 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        {/* Company Name */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block leading-tight">{c.company || 'Private Client'}</span>
                            <span className="text-[10px] text-slate-500 block font-semibold">Attn: {c.name}</span>
                          </div>
                        </td>

                        {/* Contact info */}
                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          <div>Ph: <span className="font-bold text-slate-800">{c.phone}</span></div>
                          {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                        </td>

                        {/* Docs count */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                          {c.totalDocsCount} documents
                        </td>

                        {/* Total Paid BDT */}
                        <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 font-display">
                          ৳{c.paidAmt.toLocaleString()}
                        </td>

                        {/* Pending Amt */}
                        <td className="py-3.5 px-3 text-right">
                          <span className={`font-extrabold font-display ${hasOutstanding ? 'text-rose-600' : 'text-slate-500'}`}>
                            ৳{c.pendingAmt.toLocaleString()}
                          </span>
                        </td>

                        {/* Pipeline info */}
                        <td className="py-3.5 px-3 text-center text-slate-500">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100">
                            {c.offersCount} Offers
                          </span>
                          <span className="inline-block ml-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            {c.quotesCount} Quotes
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No customer reports match this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Product sales reports */}
      {activeReportTab === 'product' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filters */}
          <div className="flex bg-white border border-slate-200 p-4 rounded-xl items-center gap-3 shadow-2xs">
            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Filter Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-hidden cursor-pointer"
            >
              {brands.map(b => (
                <option key={b} value={b}>{b === 'All' ? 'All Brands Sourced' : b}</option>
              ))}
            </select>
          </div>

          {/* Product Sales table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Item SKU / Name</th>
                  <th className="py-3.5 px-3">Brand Origin</th>
                  <th className="py-3.5 px-3 text-right">Standard Price</th>
                  <th className="py-3.5 px-3 text-center">Remaining Stock</th>
                  <th className="py-3.5 px-3 text-center">Quantity Sold</th>
                  <th className="py-3.5 px-4 text-right">Total Revenue BDT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProductReport.length > 0 ? (
                  displayedProductReport.map(p => {
                    const isOutOfStock = p.stock === 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        {/* Name SKU */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block leading-tight">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{p.sku}</span>
                          </div>
                        </td>

                        {/* Brand */}
                        <td className="py-3.5 px-3">
                          <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            {p.brand}
                          </span>
                        </td>

                        {/* Standard price */}
                        <td className="py-3.5 px-3 text-right font-extrabold text-slate-950 font-display">
                          ৳{p.price.toLocaleString()} / {p.unit}
                        </td>

                        {/* Remaining stock */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-extrabold text-sm ${isOutOfStock ? 'text-rose-600 font-display' : 'text-slate-800'}`}>
                            {p.stock}
                          </span>
                        </td>

                        {/* Quantity sold */}
                        <td className="py-3.5 px-3 text-center font-extrabold text-blue-900">
                          {p.qtySold} sold
                        </td>

                        {/* Total Revenue */}
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 font-display">
                          ৳{p.totalRevenue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No products matched your brand filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
