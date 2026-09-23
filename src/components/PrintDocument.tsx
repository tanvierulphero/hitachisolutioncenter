import { useState } from 'react';
import { Document, BusinessSettings } from '../types';
import { Mail, Phone, Globe, MapPin, Printer, Download, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface PrintDocumentProps {
  document: Document;
  settings: BusinessSettings;
  onBack?: () => void;
}

// Convert numbers to Bangladeshi/Indian format words (Taka Only)
function numberToWords(num: number): string {
  const integerPart = Math.floor(num);
  if (integerPart === 0) return 'Zero Taka Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const grp = (n: number): string => {
    let s = '';
    const h = Math.floor(n / 100);
    const t = n % 100;
    if (h) {
      s += a[h] + ' Hundred ';
    }
    if (t) {
      if (s !== '') s += 'and ';
      if (t < 20) {
        s += a[t];
      } else {
        s += b[Math.floor(t / 10)] + (t % 10 ? '-' + a[t % 10] : '');
      }
    }
    return s.trim();
  };

  let rem = integerPart;
  let words = '';

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  const hundred = Math.floor(rem / 100);
  rem %= 100;

  if (crore) {
    words += grp(crore) + ' Crore ';
  }
  if (lakh) {
    words += grp(lakh) + ' Lakh ';
  }
  if (thousand) {
    words += grp(thousand) + ' Thousand ';
  }
  if (hundred) {
    words += grp(hundred) + ' Hundred ';
  }
  if (rem) {
    if (words !== '') words += 'and ';
    if (rem < 20) {
      words += a[rem] + ' ';
    } else {
      words += b[Math.floor(rem / 10)] + (rem % 10 ? '-' + a[rem % 10] : '') + ' ';
    }
  }

  return words.trim() + ' Taka Only';
}

export default function PrintDocument({ document, settings, onBack }: PrintDocumentProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessNotice, setPdfSuccessNotice] = useState(false);

  const isOffer = document.type === 'OFFER_LETTER';
  const isQuotation = document.type === 'QUOTATION';
  const isInvoice = document.type === 'INVOICE';
  const isBill = document.type === 'BILL';

  // Format document titles for presentation
  const getDocTitle = () => {
    switch (document.type) {
      case 'OFFER_LETTER': return 'OFFER LETTER';
      case 'QUOTATION': return 'QUOTATION';
      case 'BILL': return 'BILL';
      case 'INVOICE': return 'INVOICE';
      default: return 'DOCUMENT';
    }
  };

  // Native high-fidelity print on the main window directly using exact A4 styles
  const handlePrint = () => {
    window.print();
  };

  // Download PDF file directly using browser native SVG engine (html-to-image) and jsPDF
  const handleSavePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfSuccessNotice(false);

    // Fail-safe timeout to guarantee button state is reset
    const safetyTimeout = setTimeout(() => {
      setIsGeneratingPdf(false);
    }, 8000);

    try {
      const element = window.document.getElementById('printable-area');
      if (!element) {
        setIsGeneratingPdf(false);
        clearTimeout(safetyTimeout);
        alert('Printable document area not found.');
        return;
      }

      const cleanCustomerName = document.customerName ? document.customerName.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
      const filename = `${document.docNumber}_${cleanCustomerName}.pdf`;

      // Render the DOM node to a crisp high-resolution PNG using browser's native engine
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      // Construct A4 PDF document (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Fit PNG image perfectly onto A4 canvas
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      pdf.save(filename);

      setPdfSuccessNotice(true);
      setTimeout(() => setPdfSuccessNotice(false), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('An error occurred while generating the PDF file. Please try again.');
    } finally {
      clearTimeout(safetyTimeout);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen py-8 px-4 flex flex-col items-center">
      {/* Top action bar, hidden in print mode */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center justify-between no-print">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>
          )}
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            {getDocTitle()} : <span className="font-mono text-blue-900 font-extrabold">{document.docNumber}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            title="Open browser print preview dialog"
          >
            <Printer className="w-4 h-4 text-blue-300" />
            Print Document
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleSavePdf}
            disabled={isGeneratingPdf}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download PDF file directly to your device"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                Downloading PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-300" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {pdfSuccessNotice && (
        <div className="w-full max-w-4xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between text-xs font-bold shadow-xs animate-fade-in no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PDF Document successfully generated and saved to downloads!</span>
          </div>
          <button onClick={() => setPdfSuccessNotice(false)} className="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {/* RENDER STYLED LETTERHEAD SHEETS FOR PRINT AND DISPLAY */}
      <div className="w-full max-w-full overflow-x-auto pb-8 flex justify-center no-scrollbar">
        <div 
          id="printable-area" 
          className="bg-white shadow-xl rounded-lg p-8 md:p-10 text-slate-800 watermark-container flex flex-col justify-between border border-slate-100 relative print-container mx-auto"
          style={{ width: '210mm', minWidth: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
        >
          {/* Header Logo background watermark for crisp PDF/Print support */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[85%] pointer-events-none select-none z-0" style={{ color: '#1e3a8a', opacity: 0.04 }}>
            <Logo className="w-full h-auto text-blue-900" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            {/* Header Block matching uploaded image */}
            <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: '2px solid #1e3a8a' }}>
              {/* Left Brand Identity */}
              <div className="flex items-center gap-3 h-14 w-auto flex-shrink-0">
                <Logo className="h-full w-auto text-blue-900" />
              </div>

              {/* Right Contact Details */}
              <div className="text-right text-[11px] text-slate-600 space-y-0.5 font-sans flex-shrink-0">
                <div className="flex items-center justify-end gap-1 font-semibold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  <span>Corporate Office: {settings.address}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  <span>{settings.phone1}, {settings.phone2}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  <span>{settings.email}</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-blue-800 font-medium" style={{ color: '#1d4ed8' }}>
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <a href={`https://${settings.website}`} target="_blank" rel="noopener noreferrer">{settings.website}</a>
                </div>
              </div>
            </div>

            {/* Document Title Bar */}
            <div className="flex justify-between items-center bg-slate-100 px-4 py-2 rounded mb-3" style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #1e3a8a' }}>
              <span className="text-sm font-bold text-blue-900 font-display uppercase tracking-wider" style={{ color: '#1e3a8a' }}>
                {getDocTitle()}
              </span>
              <div className="text-right text-xs space-y-0.5">
                <div><span className="font-semibold text-slate-500">No:</span> <span className="font-bold text-slate-800">{document.docNumber}</span></div>
                <div><span className="font-semibold text-slate-500">Date:</span> <span className="font-semibold text-slate-800">{document.date}</span></div>
                {document.dueDate && (
                  <div><span className="font-semibold text-rose-500" style={{ color: '#f43f5e' }}>Due Date:</span> <span className="font-bold text-slate-800">{document.dueDate}</span></div>
                )}
              </div>
            </div>

            {/* Customer Metadata Block */}
            <div className="grid grid-cols-2 gap-4 mb-3 text-xs leading-relaxed pb-3" style={{ borderBottom: '1px solid #cbd5e1' }}>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Recipient / Client:</h3>
                <p className="text-xs font-bold text-slate-900 font-display">{document.customerName}</p>
                {document.customerCompany && (
                  <p className="font-semibold text-slate-700" style={{ color: '#334155' }}>{document.customerCompany}</p>
                )}
                <p className="text-slate-600 mt-0.5 flex items-center gap-1 text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400 inline" style={{ color: '#94a3b8' }} /> {document.customerPhone}
                </p>
                {document.customerEmail && (
                  <p className="text-slate-600 flex items-center gap-1 text-[11px]">
                    <Mail className="w-3 h-3 text-slate-400 inline" style={{ color: '#94a3b8' }} /> {document.customerEmail}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Address:</h3>
                <p className="text-slate-700 whitespace-pre-line text-[11px] leading-snug" style={{ color: '#334155' }}>{document.customerAddress}</p>
              </div>
            </div>

            {/* Offer Letter / Quotation Paragraphs */}
            {(isOffer || isQuotation) && (
              <div className="mb-4 space-y-2 text-xs leading-relaxed text-slate-700">
                {document.subject && (
                  <p className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                    <span className="text-blue-900">Subject:</span> {document.subject}
                  </p>
                )}
                {document.salutation && (
                  <p className="font-semibold text-slate-800">{document.salutation}</p>
                )}
                {document.openingParagraph && (
                  <p className="whitespace-pre-line text-[11px]">{document.openingParagraph}</p>
                )}
              </div>
            )}

            {/* DOCUMENT ITEMS TABLE */}
            {document.items && document.items.length > 0 ? (
              <div className="w-full mb-3 relative z-10">
                <table className="w-full text-left text-[11px] border-collapse table-fixed">
                  <thead>
                    <tr className="text-white uppercase text-[9px] tracking-wider font-bold" style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                      <th className="py-2 px-2 text-center rounded-l w-[36px]" style={{ textAlign: 'center' }}>SL</th>
                      <th className="py-2 px-2.5 text-left" style={{ textAlign: 'left' }}>Description of Goods / Spare Parts</th>
                      <th className="py-2 px-2 text-center w-[90px]" style={{ textAlign: 'center' }}>Brand</th>
                      <th className="py-2 px-2 text-center w-[48px]" style={{ textAlign: 'center' }}>Qty</th>
                      <th className="py-2 px-2 text-center w-[48px]" style={{ textAlign: 'center' }}>Unit</th>
                      <th className="py-2 px-2.5 text-right w-[100px]" style={{ textAlign: 'right' }}>Unit Price (BDT)</th>
                      <th className="py-2 px-2.5 text-right rounded-r w-[115px]" style={{ textAlign: 'right' }}>Total Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {document.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2 text-center font-medium text-slate-500" style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td className="py-2 px-2.5 font-semibold text-slate-900 whitespace-normal leading-tight" style={{ textAlign: 'left' }}>
                          {item.name}
                        </td>
                        <td className="py-2 px-2 text-center" style={{ textAlign: 'center' }}>
                          <span className="inline-block bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                            {item.brand}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-slate-900" style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td className="py-2 px-2 text-center font-medium text-slate-500" style={{ textAlign: 'center' }}>{item.unit || 'Pcs'}</td>
                        <td className="py-2 px-2.5 text-right font-semibold text-slate-900" style={{ textAlign: 'right' }}>৳{item.price.toLocaleString()}</td>
                        <td className="py-2 px-2.5 text-right font-extrabold text-slate-900" style={{ textAlign: 'right' }}>৳{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded border border-dashed border-slate-200 mb-4" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: '1px', borderStyle: 'dashed' }}>
                No items listed in this document.
              </div>
            )}

            {/* Pricing Totals & Word Conversion */}
            <div className="grid grid-cols-12 gap-3 items-start mb-3 relative z-10">
              {/* Word Conversion (Left column) */}
              <div className="col-span-7 p-3 rounded-lg" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', borderWidth: '1px', borderStyle: 'solid' }}>
                <span className="text-[9px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: '#1e3a8a' }}>
                  Amount in Words
                </span>
                <p className="text-xs font-bold italic" style={{ color: '#1e3a8a' }}>
                  {numberToWords(document.total)}
                </p>
              </div>

              {/* Calculations Breakdown (Right column) */}
              <div className="col-span-5 text-xs space-y-1 font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Sub-Total:</span>
                  <span className="text-slate-800 font-semibold">৳{document.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>VAT / Tax ({document.taxRate}%):</span>
                  <span className="text-slate-800 font-semibold">৳{document.taxAmount.toLocaleString()}</span>
                </div>
                {document.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold" style={{ color: '#e11d48' }}>
                    <span>Special Discount:</span>
                    <span>- ৳{document.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-1.5 text-blue-900" style={{ borderColor: '#cbd5e1' }}>
                  <span style={{ color: '#1e3a8a' }}>Total Payable:</span>
                  <span className="text-base font-extrabold text-blue-950" style={{ color: '#1e3a8a' }}>৳{document.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms, Conditions & Closing */}
            <div className="grid grid-cols-2 gap-4 mt-2 border-t border-slate-100 pt-3 text-xs relative z-10" style={{ borderTop: '1px solid #f1f5f9' }}>
              {/* Left side: Terms of Offer */}
              {document.terms ? (
                <div className="p-3 rounded" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: '1px', borderStyle: 'solid' }}>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-200 pb-1 text-[9px]" style={{ borderColor: '#e2e8f0' }}>
                    Terms & Conditions:
                  </h4>
                  <p className="whitespace-pre-line text-[10px] text-slate-600 leading-relaxed font-sans">
                    {document.terms}
                  </p>
                </div>
              ) : <div />}

              {/* Right side: Closing letter text & Signatures */}
              <div className="flex flex-col justify-between items-end text-right h-full min-h-[110px]">
                {(isOffer || isQuotation) && document.closingParagraph && (
                  <p className="text-slate-600 italic text-[10px] mb-3 leading-normal max-w-xs">
                    {document.closingParagraph}
                  </p>
                )}
                
                <div className="mt-auto pt-2 text-right w-44">
                  <div className="h-8 w-full mb-1" style={{ borderBottom: '1px solid #94a3b8' }}></div>
                  <p className="font-bold text-slate-900 text-xs font-display leading-none">{document.signatureName}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 uppercase font-semibold" style={{ color: '#64748b' }}>{document.signatureLabel}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5" style={{ color: '#94a3b8' }}>{settings.name}</p>
                </div>
              </div>
            </div>

            {/* High-Fidelity Print Slogan and Brands Footer matching the image */}
            <div className="pt-3 mt-auto text-center relative z-10" style={{ borderTop: '2px solid #1e3a8a' }}>
              {/* Logo labels representing standard machinery footer brands with exact colors and uppercase styling */}
              <div className="flex flex-wrap items-center justify-center gap-y-1.5 gap-x-2 mb-2 text-[9px] font-extrabold tracking-wider font-sans uppercase">
                <span className="text-[#0a192f] font-black">HITACHI</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#0054a6] font-black">ATLAS COPCO</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#007cc3] font-black">LINGHEIN</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#f15a24] font-black">KAESER</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#009639] font-black">BOGE</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#ed1c24] font-black">ELGI</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#003b46] font-black">JAGUAR</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#e31b23] font-black">IR INGERSOLL RAND</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#00529b] font-black">GARDNER DENVER</span>
              </div>
              <p className="text-[10px] font-bold italic font-sans" style={{ color: '#1e3a8a' }}>
                "We supply all brand screw air compressor genuine spare parts"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
