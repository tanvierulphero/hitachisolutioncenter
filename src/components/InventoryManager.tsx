import { useState, useMemo } from 'react';
import { Product, ProductSpec, Document, FieldDispatch } from '../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  ChevronsUpDown, 
  Eye, 
  Upload, 
  Loader2, 
  BarChart3, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  FileText, 
  ShoppingBag, 
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { apiUploadImage } from '../lib/api';

interface InventoryManagerProps {
  products: Product[];
  documents?: Document[];
  dispatches?: FieldDispatch[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onViewDocument?: (doc: Document) => void;
}

export default function InventoryManager({
  products,
  documents = [],
  dispatches = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onViewDocument
}: InventoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Lifetime History Modal State
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await apiUploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: res.url }));
    } catch (err: any) {
      alert('Image upload failed: ' + (err.message || 'Could not upload file to server'));
    } finally {
      setIsUploading(false);
    }
  };
  
  const [formData, setFormData] = useState<{
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
  }>({
    name: '',
    sku: '',
    category: 'Screw Air Compressor',
    brand: 'Hitachi',
    price: 0,
    stock: 0,
    unit: 'Pcs',
    description: '',
    specs: [{ label: '', value: '' }],
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60'
  });

  // LIFETIME ANALYTICS & BUYER LOG CALCULATIONS
  const productAnalytics = useMemo(() => {
    if (!historyProduct) return null;

    // 1. Find all Sales Invoices / Documents containing this product
    const salesRecords: {
      docId: string;
      docNumber: string;
      docType: string;
      date: string;
      customerId: string;
      customerName: string;
      customerCompany: string;
      customerPhone: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      unit: string;
      status: string;
      doc: Document;
    }[] = [];

    // 2. Find all Purchase Bills containing this product
    const purchaseRecords: {
      docId: string;
      docNumber: string;
      date: string;
      supplierName: string;
      quantity: number;
      buyPrice: number;
      lineTotal: number;
      doc: Document;
    }[] = [];

    documents.forEach(doc => {
      doc.items.forEach(it => {
        // Match by productId or SKU/name
        const isMatch = (it.productId && it.productId === historyProduct.id) ||
                        (it.name && historyProduct.sku && it.name.toLowerCase().includes(historyProduct.sku.toLowerCase())) ||
                        (it.name && historyProduct.name && it.name.toLowerCase().includes(historyProduct.name.toLowerCase()));

        if (isMatch) {
          if (doc.type === 'INVOICE' || doc.type === 'QUOTATION' || doc.type === 'OFFER_LETTER') {
            salesRecords.push({
              docId: doc.id,
              docNumber: doc.docNumber,
              docType: doc.type,
              date: doc.date,
              customerId: doc.customerId,
              customerName: doc.customerName,
              customerCompany: doc.customerCompany || doc.customerName,
              customerPhone: doc.customerPhone,
              quantity: it.quantity,
              unitPrice: it.price,
              lineTotal: it.total,
              unit: it.unit || historyProduct.unit || 'Pcs',
              status: doc.status,
              doc
            });
          } else if (doc.type === 'BILL') {
            purchaseRecords.push({
              docId: doc.id,
              docNumber: doc.docNumber,
              date: doc.date,
              supplierName: doc.customerCompany || doc.customerName || 'Vendor Supplier',
              quantity: it.quantity,
              buyPrice: it.price,
              lineTotal: it.total,
              doc
            });
          }
        }
      });
    });

    // 3. Find field dispatches containing this product
    const dispatchRecords = dispatches.filter(d => 
      d.items.some(it => 
        (it.productId && it.productId === historyProduct.id) || 
        (it.productName && historyProduct.name && it.productName.toLowerCase().includes(historyProduct.name.toLowerCase()))
      )
    );

    // Sum total quantities & financial revenue
    const invoiceSales = salesRecords.filter(r => r.docType === 'INVOICE');
    const totalQtySold = invoiceSales.reduce((s, r) => s + r.quantity, 0);
    const totalSalesRevenue = invoiceSales.reduce((s, r) => s + r.lineTotal, 0);

    const totalQtyPurchased = purchaseRecords.reduce((s, r) => s + r.quantity, 0) + historyProduct.stock + totalQtySold;
    const totalPurchaseCostEstimate = totalQtySold * (historyProduct.price * 0.70); // Estimated 30% margin cost if bill price missing
    const totalPurchaseCostActual = purchaseRecords.reduce((s, r) => s + r.lineTotal, 0) || totalPurchaseCostEstimate;

    // Profit or Loss
    const netProfitLoss = totalSalesRevenue - totalPurchaseCostActual;
    const marginPercent = totalSalesRevenue > 0 ? (netProfitLoss / totalSalesRevenue) * 100 : 0;

    return {
      historyProduct,
      salesRecords,
      invoiceSales,
      purchaseRecords,
      dispatchRecords,
      totalQtyPurchased,
      totalQtySold,
      availableStock: historyProduct.stock,
      totalSalesRevenue,
      totalPurchaseCostActual,
      netProfitLoss,
      marginPercent,
      isProfit: netProfitLoss >= 0
    };
  }, [historyProduct, documents, dispatches]);
  const brands = ['Hitachi', 'Atlas Copco', 'KAESER', 'BOGE', 'ELGi', 'Linghein', 'JAGUAR', 'IR Ingersoll Rand', 'Gardner Denver'];

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Handle + / - Quick Stock Adjustments
  const handleQuickStock = (product: Product, delta: number) => {
    const updated = { ...product, stock: Math.max(0, product.stock + delta) };
    onUpdateProduct(updated);
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Screw Air Compressor',
      brand: 'Hitachi',
      price: 0,
      stock: 0,
      unit: 'Pcs',
      description: '',
      specs: [{ label: 'Motor Power', value: '' }, { label: 'Working Pressure', value: '' }],
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60'
    });
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      description: product.description,
      specs: product.specs && product.specs.length > 0 ? [...product.specs] : [{ label: '', value: '' }],
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60'
    });
    setIsFormOpen(true);
  };

  // Handle Spec Adding / Editing
  const handleAddSpecField = () => {
    setFormData({ ...formData, specs: [...formData.specs, { label: '', value: '' }] });
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    const nextSpecs = [...formData.specs];
    nextSpecs[index][field] = val;
    setFormData({ ...formData, specs: nextSpecs });
  };

  const handleRemoveSpecField = (index: number) => {
    const nextSpecs = formData.specs.filter((_, i) => i !== index);
    setFormData({ ...formData, specs: nextSpecs.length > 0 ? nextSpecs : [{ label: '', value: '' }] });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      alert("Name and SKU SKU/Model are required.");
      return;
    }

    // Clean empty specs
    const cleanSpecs = formData.specs.filter(s => s.label.trim() !== '' && s.value.trim() !== '');

    if (editingId) {
      // Update
      onUpdateProduct({
        id: editingId,
        ...formData,
        specs: cleanSpecs
      });
    } else {
      // Create
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...formData,
        specs: cleanSpecs
      };
      onAddProduct(newProduct);
    }
    
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Upper toolbar controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by SKU or Brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-900"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          Add Catalog Product
        </button>
      </div>

      {/* Main Table view */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Item SKU / Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3 text-right">Standard Price</th>
                <th className="py-3 px-4 text-center">Stock Volume</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => {
                  const isLowStock = product.stock < 5;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & SKU */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block leading-tight">{product.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">{product.sku}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-600 font-semibold">{product.category}</span>
                      </td>

                      {/* Brand */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {product.brand}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 font-display">
                        ৳{product.price.toLocaleString()} / {product.unit}
                      </td>

                      {/* Stock with adjustment controls */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Decrement */}
                          <button
                            onClick={() => handleQuickStock(product, -1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center cursor-pointer"
                            title="Decrease Stock"
                          >
                            -
                          </button>
                          
                          {/* Stock display */}
                          <span className={`w-10 text-center font-extrabold text-sm ${isLowStock ? 'text-rose-600 font-display' : 'text-slate-900'}`}>
                            {product.stock}
                          </span>

                          {/* Increment */}
                          <button
                            onClick={() => handleQuickStock(product, 1)}
                            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center justify-center cursor-pointer"
                            title="Increase Stock"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Stock Status badges */}
                      <td className="py-3.5 px-3 text-center">
                        {product.stock === 0 ? (
                          <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            Adequate
                          </span>
                        )}
                      </td>

                      {/* Operations */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setHistoryProduct(product)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-extrabold text-[10px] uppercase rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="View Lifetime History, Profit/Loss & Buyers Ledger"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
                            লাইফটাইম হিসাব
                          </button>

                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
                            title="Edit details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${product.name} from the catalog?`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg hover:text-rose-700 transition-colors border border-rose-200 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                    No products matched your search or category filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (Add & Edit details) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-blue-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold font-display text-base">
                {editingId ? 'Edit Catalog Product Details' : 'Register New Machinery Catalog Product'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-white hover:text-slate-200 font-bold bg-white/10 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Product title / name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Product Name / Model Description <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hitachi Hiscrew 37 S-Type Screw Compressor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU Code */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">SKU / Model Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HIT-HS-37S"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Unit type */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Unit of Measurement (e.g. Set, Pcs, Can)</label>
                  <input
                    type="text"
                    placeholder="e.g. Set"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category dropdown */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Category Group</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Brand dropdown */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Brand Sourced</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden cursor-pointer"
                  >
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price (Taka BDT) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Est Price in BDT (Taka)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Stock volume */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Initial Stock Volume</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Extended descriptive text */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Catalog Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide brief details about physical design, utility, or applications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Specs array editor */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Technical Specs (Key-Value)</label>
                  <button
                    type="button"
                    onClick={handleAddSpecField}
                    className="px-2.5 py-1 text-blue-900 bg-blue-50 hover:bg-blue-100 rounded font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    + Add Spec Row
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Spec Label (e.g. Air Flow)"
                        value={spec.label}
                        onChange={(e) => handleSpecChange(i, 'label', e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 6.2 m³/min)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecField(i)}
                        className="px-2.5 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Image Upload & Server Link */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="font-bold text-slate-700 block">Product Image (cPanel Server Upload or URL)</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {formData.imageUrl && (
                    <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 relative">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className={`px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-2 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                            <span>Uploading to cPanel...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload Image File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Or type image URL</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. /uploads/prod_123.jpg or https://..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-hidden text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold uppercase tracking-wider rounded-lg shadow-xs cursor-pointer"
                >
                  {editingId ? 'Save Updates' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIFETIME PRODUCT HISTORY & PROFIT/LOSS ANALYTICS MODAL */}
      {historyProduct && productAnalytics && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-5 flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-white/20 text-blue-200 px-2 py-0.5 rounded">
                    {productAnalytics.historyProduct.sku}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-300">
                    {productAnalytics.historyProduct.brand} &bull; {productAnalytics.historyProduct.category}
                  </span>
                </div>
                <h3 className="text-base font-black font-display text-white">
                  {productAnalytics.historyProduct.name} - লাইফটাইম হিসাব ও ক্রেতা খাতা
                </h3>
              </div>

              <button
                onClick={() => setHistoryProduct(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* Stat Cards 6-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">মোট ক্রয় করা হইছে</span>
                  <span className="text-lg font-black font-display text-slate-900 block">
                    {productAnalytics.totalQtyPurchased} <span className="text-xs text-slate-500 font-semibold">{productAnalytics.historyProduct.unit}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">বিল ও প্রাথমিক স্টক</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">মোট বিক্রয় করা হইছে</span>
                  <span className="text-lg font-black font-display text-blue-900 block">
                    {productAnalytics.totalQtySold} <span className="text-xs text-slate-500 font-semibold">{productAnalytics.historyProduct.unit}</span>
                  </span>
                  <span className="text-[9px] text-blue-700 font-semibold">ইনভয়েসে মোট বিক্রিত</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">বর্তমান মজুদ স্টক</span>
                  <span className={`text-lg font-black font-display block ${
                    productAnalytics.availableStock < 5 ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {productAnalytics.availableStock} <span className="text-xs text-slate-500 font-semibold">{productAnalytics.historyProduct.unit}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">শোরুম ওয়্যারহাউস</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">মোট বিক্রয় মূল্য</span>
                  <span className="text-lg font-black font-display text-blue-950 block">
                    ৳{productAnalytics.totalSalesRevenue.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">মোট আয়</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">মোট ক্রয় খরচ</span>
                  <span className="text-lg font-black font-display text-slate-800 block">
                    ৳{productAnalytics.totalPurchaseCostActual.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">ক্রয় বাবদ ব্যয়</span>
                </div>

                <div className={`p-3 rounded-xl space-y-1 border ${
                  productAnalytics.isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                }`}>
                  <span className={`text-[9px] font-bold uppercase block ${
                    productAnalytics.isProfit ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {productAnalytics.isProfit ? 'সর্বমোট নিট লাভ' : 'সর্বমোট নিট ক্ষতি'}
                  </span>
                  <span className={`text-lg font-black font-display block ${
                    productAnalytics.isProfit ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    ৳{Math.abs(productAnalytics.netProfitLoss).toLocaleString()}
                  </span>
                  <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                    productAnalytics.isProfit ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {productAnalytics.isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {productAnalytics.marginPercent.toFixed(1)}% Margin
                  </span>
                </div>
              </div>

              {/* TABLE 1: BUYERS LEDGER ("কার কাছে কত পিস বিক্রয় হইছে") */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-xs font-display flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-900" />
                    কার কার কাছে কত পিস বিক্রয় হইছে (Buyers Sales Ledger)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {productAnalytics.invoiceSales.length} Customer Transactions
                  </span>
                </div>

                {productAnalytics.invoiceSales.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">তারিখ ও ইনভয়েস নং</th>
                          <th className="py-2.5 px-3">ক্রেতা কোম্পানি / নাম</th>
                          <th className="py-2.5 px-3 text-center">বিক্রিত পরিমাণ</th>
                          <th className="py-2.5 px-3 text-right">একক মূল্য</th>
                          <th className="py-2.5 px-3 text-right">মোট বিক্রি</th>
                          <th className="py-2.5 px-3 text-center">ইনভয়েস স্টেটাস</th>
                          <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {productAnalytics.invoiceSales.map((sale, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold">
                              <span className="font-mono font-bold text-blue-900 block">{sale.docNumber}</span>
                              <span className="text-[10px] text-slate-400">{sale.date}</span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block leading-tight">{sale.customerCompany}</span>
                              <span className="text-[10px] text-slate-500">Attn: {sale.customerName} &bull; {sale.customerPhone}</span>
                            </td>

                            <td className="py-2.5 px-3 text-center font-black text-slate-900 font-display text-sm">
                              {sale.quantity} <span className="text-xs text-slate-500 font-normal">{sale.unit}</span>
                            </td>

                            <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                              ৳{sale.unitPrice.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-950 font-display">
                              ৳{sale.lineTotal.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                sale.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {sale.status}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              {onViewDocument && (
                                <button
                                  onClick={() => {
                                    setHistoryProduct(null);
                                    onViewDocument(sale.doc);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 font-bold text-[9px] uppercase rounded transition-colors border border-slate-200 cursor-pointer"
                                >
                                  Invoice
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                    <p className="font-bold text-slate-700">এই প্রডাক্টটির এখনও কোন বিক্রয় ইনভয়েস তৈরি হয়নি</p>
                  </div>
                )}
              </div>

              {/* TABLE 2: PURCHASE & SUPPLIER LOG ("কোথা থেকে কত পিস ক্রয় করা হইছে") */}
              {productAnalytics.purchaseRecords.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 text-xs font-display flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    কোথা থেকে কত পিস ক্রয় করা হইছে (Purchase Bills Log)
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">বিল নম্বর ও তারিখ</th>
                          <th className="py-2.5 px-3">সরবরাহকারী (Supplier Vendor)</th>
                          <th className="py-2.5 px-3 text-center">ক্রয়কৃত পরিমাণ</th>
                          <th className="py-2.5 px-3 text-right">একক ক্রয়মূল্য</th>
                          <th className="py-2.5 px-3 text-right">মোট খরচ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {productAnalytics.purchaseRecords.map((pRec, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-slate-900 block">{pRec.docNumber}</span>
                              <span className="text-[10px] text-slate-400">{pRec.date}</span>
                            </td>

                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              {pRec.supplierName}
                            </td>

                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                              {pRec.quantity} Pcs
                            </td>

                            <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                              ৳{pRec.buyPrice.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-display">
                              ৳{pRec.lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase rounded-xl cursor-pointer"
              >
                বন্ধ করুন (Close)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
