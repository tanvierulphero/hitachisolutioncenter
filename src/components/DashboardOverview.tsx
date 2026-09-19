import { Document, Product, Customer } from '../types';
import { TrendingUp, FileText, ShoppingCart, Users, ChevronRight, ArrowUpRight, Clock, BookOpen } from 'lucide-react';

interface DashboardOverviewProps {
  documents: Document[];
  products: Product[];
  customers: Customer[];
  onNavigateToTab: (tab: string) => void;
  onViewDocument: (doc: Document) => void;
}

export default function DashboardOverview({
  documents,
  products,
  customers,
  onNavigateToTab,
  onViewDocument
}: DashboardOverviewProps) {
  
  // Calculations supporting partial dues tracking
  const metrics = {
    totalSales: documents
      .filter(d => d.type === 'INVOICE' || d.type === 'BILL')
      .reduce((sum, d) => {
        if (d.paidAmount !== undefined) return sum + d.paidAmount;
        return d.status === 'Paid' ? sum + d.total : 0;
      }, 0),
    pendingReceivables: documents
      .filter(d => d.type === 'INVOICE' || d.type === 'BILL')
      .reduce((sum, d) => {
        if (d.dueAmount !== undefined) return sum + d.dueAmount;
        return d.status !== 'Paid' ? sum + d.total : 0;
      }, 0),
    totalDocs: documents.length,
    activeProducts: products.length,
    totalStockValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
    totalCustomers: customers.length
  };

  // Document breakdown count
  const docCounts = {
    offers: documents.filter(d => d.type === 'OFFER_LETTER').length,
    quotes: documents.filter(d => d.type === 'QUOTATION').length,
    bills: documents.filter(d => d.type === 'BILL').length,
    invoices: documents.filter(d => d.type === 'INVOICE').length
  };

  // Recent transactions (limit 5)
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Group inventory items by brand to calculate share
  const brandStockCount = products.reduce((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + p.stock;
    return acc;
  }, {} as Record<string, number>);

  const brandsShare = Object.entries(brandStockCount)
    .map(([brand, stock]) => ({ brand, stock }))
    .sort((a, b) => b.stock - a.stock);

  return (
    <div className="space-y-8 text-xs">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Collected Revenue
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              ৳{metrics.totalSales.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Received Cash & Cheques
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 1b - Outstanding Dues */}
        <button
          onClick={() => onNavigateToTab('due_ledger')}
          className="bg-rose-50/50 hover:bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs transition-all text-left group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
              Outstanding Dues
            </span>
            <span className="text-xl font-black font-display text-rose-700 block">
              ৳{metrics.pendingReceivables.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-rose-600 flex items-center gap-1 group-hover:underline">
              Manage Ledger <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-10 h-10 bg-rose-100 text-rose-600 border border-rose-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5 animate-pulse" />
          </div>
        </button>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Documents Created
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              {metrics.totalDocs}
            </span>
            <span className="text-[9px] font-semibold text-slate-500 block">
              All categories total
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Stock Valuation
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              ৳{metrics.totalStockValue.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-500 block">
              Across {metrics.activeProducts} products
            </span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Clients
            </span>
            <span className="text-xl font-extrabold font-display text-blue-950 block">
              {metrics.totalCustomers}
            </span>
            <span className="text-[9px] font-bold text-slate-500 block">
              Factory purchasing desk
            </span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts & Spares Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Document Portfolio Mix - Custom Interactive SVG Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-8 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Document Creation Analytics</h3>
            <p className="text-slate-400 text-[11px] mb-6">Distribution and volume mix of documents in hitachisolutioncenter.</p>
          </div>

          {/* Simple custom visual bar-graph using pure CSS & SVG */}
          <div className="space-y-4 py-2">
            {/* Offer Letters Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Offer Letters
                </span>
                <span>{docCounts.offers} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.offers / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Quotations Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Quotations
                </span>
                <span>{docCounts.quotes} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.quotes / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Invoices Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Invoices
                </span>
                <span>{docCounts.invoices} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.invoices / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Bills Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Purchase Bills
                </span>
                <span>{docCounts.bills} items</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-600 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.totalDocs ? (docCounts.bills / metrics.totalDocs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Operational Data is Persisted</span>
            <button 
              onClick={() => onNavigateToTab('docs')} 
              className="text-blue-900 hover:text-blue-950 font-bold hover:underline cursor-pointer"
            >
              Manage Documents &rarr;
            </button>
          </div>
        </div>

        {/* Brand Inventory Stock share list */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Brand Stock Distribution</h3>
            <p className="text-slate-400 text-[11px] mb-4">Total spare parts and machines in warehouse grouped by brand.</p>
          </div>

          <div className="space-y-3.5 flex-1 py-2">
            {brandsShare.slice(0, 5).map(({ brand, stock }) => {
              const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
              const percentage = totalStock ? (stock / totalStock) * 100 : 0;
              return (
                <div key={brand} className="space-y-1">
                  <div className="flex justify-between items-center font-semibold text-slate-700">
                    <span className="text-slate-900 font-bold">{brand}</span>
                    <span className="text-slate-500">{stock} Units ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-900 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigateToTab('inventory')}
            className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider rounded-lg text-center mt-4 transition-colors cursor-pointer"
          >
            Open Stock Inventory
          </button>
        </div>
      </div>

      {/* Recent Activity Log & Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 font-display">Recent Operations Desk Activity</h3>
          </div>
          <button 
            onClick={() => onNavigateToTab('docs')}
            className="text-xs font-bold text-blue-900 hover:underline flex items-center cursor-pointer"
          >
            All Activity Logs <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 font-bold text-[10px] tracking-wider uppercase border-b border-slate-100">
                <th className="pb-3 pr-3">Doc Number</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Customer Company</th>
                <th className="pb-3 px-3 text-right">Payable</th>
                <th className="pb-3 px-3 text-center">Status</th>
                <th className="pb-3 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocs.map(doc => {
                const getBadgeClass = (status: string) => {
                  switch (status) {
                    case 'Paid':
                    case 'Accepted':
                    case 'Active':
                      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    case 'Unpaid':
                      return 'bg-amber-100 text-amber-800 border-amber-200';
                    case 'Sent':
                      return 'bg-blue-100 text-blue-800 border-blue-200';
                    default:
                      return 'bg-slate-100 text-slate-700 border-slate-200';
                  }
                };

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-3 font-bold text-blue-900">{doc.docNumber}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {doc.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-medium">{doc.date}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">{doc.customerCompany || doc.customerName}</td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">৳{doc.total.toLocaleString()}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block border text-[9px] font-bold px-2 py-0.5 rounded-full ${getBadgeClass(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <button
                        onClick={() => onViewDocument(doc)}
                        className="px-2.5 py-1 text-blue-900 hover:text-white hover:bg-blue-900 text-[10px] font-bold rounded-md border border-blue-900/10 hover:border-blue-900 transition-colors cursor-pointer"
                      >
                        Print/PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
