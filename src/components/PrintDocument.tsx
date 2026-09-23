import { useState } from 'react';
import { Document, BusinessSettings } from '../types';
import { Mail, Phone, Globe, MapPin, Printer, Download, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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

  // Download PDF file directly using CDN loaded html2pdf.js
  const handleSavePdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccessNotice(false);

    const element = window.document.getElementById('printable-area');
    if (!element) {
      setIsGeneratingPdf(false);
      window.print();
      return;
    }

    const cleanCustomerName = document.customerName ? document.customerName.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
    const filename = `${document.docNumber}_${cleanCustomerName}.pdf`;

    const opt = {
      margin: [12.7, 12.7, 12.7, 12.7] as [number, number, number, number], // Exactly 0.5 inches in mm
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        onclone: (clonedDoc: any) => {
          // 1. Setup exact dimensions matching 0.5 in margins on standard A4 (210 - 25.4 = 184.6mm wide; 297 - 25.4 = 271.6mm high)
          const printEl = clonedDoc.getElementById('printable-area');
          if (printEl) {
            printEl.style.width = '184.6mm';
            printEl.style.height = '271.6mm';
            printEl.style.padding = '0';
            printEl.style.margin = '0';
            printEl.style.boxShadow = 'none';
            printEl.style.border = 'none';
            printEl.style.boxSizing = 'border-box';
            printEl.style.backgroundColor = '#ffffff';
          }

          // 2. Overwrite oklch/oklab CSS variables and styles with hex fallbacks to prevent html2canvas from crashing
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag: any) => {
            if (styleTag.textContent) {
              styleTag.textContent = styleTag.textContent
                .replace(/oklch\([^)]+\)/gi, '#1e3a8a')
                .replace(/oklab\([^)]+\)/gi, '#1e3a8a');
            }
          });

          // 3. Remove letterSpacing styles from SVG text elements to prevent html2canvas from crashing on inline SVG parameters
          const svgTexts = clonedDoc.querySelectorAll('svg text');
          svgTexts.forEach((textNode: any) => {
            if (textNode.style) {
              textNode.style.letterSpacing = '';
            }
          });

          const overrideStyle = clonedDoc.createElement('style');
          overrideStyle.textContent = `
            :root, * {
              --color-blue-50: #eff6ff !important;
              --color-blue-100: #dbeafe !important;
              --color-blue-600: #2563eb !important;
              --color-blue-700: #1d4ed8 !important;
              --color-blue-800: #1e40af !important;
              --color-blue-900: #1e3a8a !important;
              --color-slate-50: #f8fafc !important;
              --color-slate-100: #f1f5f9 !important;
              --color-slate-200: #e2e8f0 !important;
              --color-slate-300: #cbd5e1 !important;
              --color-slate-400: #94a3b8 !important;
              --color-slate-500: #64748b !important;
              --color-slate-600: #475569 !important;
              --color-slate-700: #334155 !important;
              --color-slate-800: #1e293b !important;
              --color-slate-900: #0f172a !important;
            }
          `;
          clonedDoc.head.appendChild(overrideStyle);
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      // 1. Resolve robustly via direct ESM/CommonJS import
      let html2pdfFunc = (html2pdf as any)?.default || html2pdf;

      // 2. Fall back to globally loaded CDN version if needed
      if (typeof html2pdfFunc !== 'function') {
        html2pdfFunc = (window as any).html2pdf;
      }
      
      if (typeof html2pdfFunc === 'function') {
        await html2pdfFunc().set(opt).from(element).save();
        setPdfSuccessNotice(true);
        setTimeout(() => setPdfSuccessNotice(false), 4000);
      } else {
        console.warn('html2pdf was not found as a function');
        alert('Could not download PDF directly. Please ensure your internet connection is active.');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      alert('An error occurred while generating the PDF file.');
    } finally {
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
                download PDF
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
      <div 
        id="printable-area" 
        className="w-full md:w-[210mm] md:min-h-[297mm] bg-white shadow-xl rounded-lg p-10 md:p-14 text-slate-800 watermark-container flex flex-col justify-between border border-slate-100 relative print-container mx-auto overflow-hidden"
      >
        {/* Inline DOM vector watermark for 100% PDF/Print Rendering support */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] pointer-events-none select-none z-0 opacity-[0.035]" style={{ color: '#1e3a8a', opacity: 0.035 }}>
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
            <path d="M50,15A35,35 0 1,0 85,50A35,35 0 0,0 50,15 M50,30 A20,20 0 1,1 30,50 A20,20 0 0,1 50,30" />
            <path d="M50,5 L46,15 L54,15 Z M50,95 L46,85 L54,85 Z M5,50 L15,46 L15,54 Z M95,50 L85,46 L85,54 Z M18,18 L25,25 L21,29 Z M82,82 L75,75 L79,71 Z M18,82 L25,75 L21,71 Z M82,18 L75,25 L79,29 Z" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Header Block matching uploaded image */}
          <div className="flex flex-col md:flex-row items-center justify-between pb-5 mb-8" style={{ borderBottom: '2px solid #1e3a8a' }}>
            {/* Left Brand Identity */}
            <div className="flex items-center gap-4 mb-4 md:mb-0 h-16 w-auto">
              <Logo className="h-full w-auto text-blue-900" />
            </div>

            {/* Middle decorative bar (visible in md screens) */}
            <div className="hidden md:block h-14 w-[1px] bg-blue-300 mx-4"></div>

            {/* Right Contact Details */}
            <div className="text-right text-xs text-slate-600 space-y-1 font-sans">
              <div className="flex items-center justify-end gap-1.5 font-semibold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-blue-800" />
                <span>Corporate Office: {settings.address}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-800" />
                <span>{settings.phone1}, {settings.phone2}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-800" />
                <span>{settings.email}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-blue-800 font-medium" style={{ color: '#1d4ed8' }}>
                <Globe className="w-3.5 h-3.5" />
                <a href={`https://${settings.website}`} target="_blank" rel="noopener noreferrer">{settings.website}</a>
              </div>
            </div>
          </div>

          {/* Document Title Bar */}
          <div className="flex justify-between items-center bg-slate-100 px-4 py-2.5 rounded mb-6" style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #1e3a8a' }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs leading-relaxed pb-6" style={{ borderBottom: '1px solid #cbd5e1' }}>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Recipient / Client:</h3>
              <p className="text-sm font-bold text-slate-900 font-display">{document.customerName}</p>
              {document.customerCompany && (
                <p className="font-semibold text-slate-700" style={{ color: '#334155' }}>{document.customerCompany}</p>
              )}
              <p className="text-slate-600 mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400 inline" style={{ color: '#94a3b8' }} /> {document.customerPhone}
              </p>
              {document.customerEmail && (
                <p className="text-slate-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400 inline" style={{ color: '#94a3b8' }} /> {document.customerEmail}
                </p>
              )}
            </div>
            
            <div className="md:text-right">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 md:justify-end" style={{ color: '#94a3b8' }}>Address:</h3>
              <p className="text-slate-700 whitespace-pre-line" style={{ color: '#334155' }}>{document.customerAddress}</p>
            </div>
          </div>

          {/* Offer Letter / Quotation Paragraphs */}
          {(isOffer || isQuotation) && (
            <div className="mb-6 space-y-4 text-xs leading-relaxed text-slate-700">
              {document.subject && (
                <p className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span className="text-blue-900">Subject:</span> {document.subject}
                </p>
              )}
              {document.salutation && (
                <p className="font-semibold text-slate-800">{document.salutation}</p>
              )}
              {document.openingParagraph && (
                <p className="whitespace-pre-line">{document.openingParagraph}</p>
              )}
            </div>
          )}

          {/* DOCUMENT ITEMS TABLE */}
          {document.items && document.items.length > 0 ? (
            <div className="overflow-x-auto mb-8 relative z-10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-white uppercase text-[10px] tracking-wider font-semibold" style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                    <th className="py-2.5 px-3 text-center rounded-l w-12" style={{ textAlign: 'center', width: '48px' }}>SL</th>
                    <th className="py-2.5 px-3" style={{ textAlign: 'left' }}>Description of Goods / Spare Parts</th>
                    <th className="py-2.5 px-3 text-center" style={{ textAlign: 'center' }}>Brand</th>
                    <th className="py-2.5 px-3 text-center w-16" style={{ textAlign: 'center', width: '64px' }}>Qty</th>
                    <th className="py-2.5 px-3 text-center w-14" style={{ textAlign: 'center', width: '56px' }}>Unit</th>
                    <th className="py-2.5 px-3 text-right w-24" style={{ textAlign: 'right', width: '96px' }}>Unit Price (BDT)</th>
                    <th className="py-2.5 px-3 text-right rounded-r w-28" style={{ textAlign: 'right', width: '112px' }}>Total Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {document.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center font-medium text-slate-500" style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-normal" style={{ textAlign: 'left' }}>
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-center" style={{ textAlign: 'center' }}>
                        <span className="inline-block bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                          {item.brand}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-900" style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td className="py-3 px-3 text-center font-medium text-slate-500" style={{ textAlign: 'center' }}>{item.unit || 'Pcs'}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-900" style={{ textAlign: 'right' }}>৳{item.price.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900" style={{ textAlign: 'right' }}>৳{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded border border-dashed border-slate-200 mb-8" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: '1px', borderStyle: 'dashed' }}>
              No items listed in this document.
            </div>
          )}

          {/* Pricing Totals & Word Conversion */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-8 relative z-10">
            {/* Word Conversion (Left column) */}
            <div className="md:col-span-7 p-4 rounded-lg" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', borderWidth: '1px', borderStyle: 'solid' }}>
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#1e3a8a' }}>
                Amount in Words
              </span>
              <p className="text-xs font-bold italic" style={{ color: '#1e3a8a' }}>
                {numberToWords(document.total)}
              </p>
            </div>

            {/* Calculations Breakdown (Right column) */}
            <div className="md:col-span-5 text-xs space-y-2 font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Sub-Total:</span>
                <span className="text-slate-800">৳{document.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT / Tax ({document.taxRate}%):</span>
                <span className="text-slate-800">৳{document.taxAmount.toLocaleString()}</span>
              </div>
              {document.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold" style={{ color: '#e11d48' }}>
                  <span>Special Discount:</span>
                  <span>- ৳{document.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2.5 text-blue-900" style={{ borderColor: '#cbd5e1' }}>
                <span style={{ color: '#1e3a8a' }}>Total Payable:</span>
                <span className="text-lg font-extrabold text-blue-950" style={{ color: '#1e3a8a' }}>৳{document.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Terms, Conditions & Closing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 border-t border-slate-100 pt-8 text-xs relative z-10" style={{ borderTop: '1px solid #f1f5f9' }}>
            {/* Left side: Terms of Offer */}
            {document.terms && (
              <div className="p-4 rounded" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: '1px', borderStyle: 'solid' }}>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 text-[10px]" style={{ borderColor: '#e2e8f0' }}>
                  Terms & Conditions:
                </h4>
                <p className="whitespace-pre-line text-[11px] text-slate-600 leading-relaxed font-sans">
                  {document.terms}
                </p>
              </div>
            )}

            {/* Right side: Closing letter text & Signatures */}
            <div className="flex flex-col justify-between items-end md:text-right h-full min-h-[140px]">
              {(isOffer || isQuotation) && document.closingParagraph && (
                <p className="text-slate-600 italic text-[11px] mb-6 leading-normal md:max-w-xs">
                  {document.closingParagraph}
                </p>
              )}
              
              <div className="mt-auto pt-6 text-center md:text-right w-48">
                <div className="h-10 w-full mb-2" style={{ borderBottom: '1px solid #cbd5e1' }}></div>
                <p className="font-bold text-slate-900 font-display leading-none">{document.signatureName}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold" style={{ color: '#64748b' }}>{document.signatureLabel}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5" style={{ color: '#94a3b8' }}>{settings.name}</p>
              </div>
            </div>
          </div>

          {/* High-Fidelity Print Slogan and Brands Footer matching the image */}
          <div className="pt-4 mt-auto text-center relative z-10" style={{ borderTop: '2px solid #1e3a8a' }}>
            {/* Logo labels representing standard machinery footer brands with exact colors and uppercase styling */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-3 mb-2.5 text-[9px] md:text-[10px] font-extrabold tracking-wider font-sans uppercase">
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
            <p className="text-[11px] md:text-xs font-bold italic font-sans" style={{ color: '#1e3a8a' }}>
              "We supply all brand screw air compressor genuine spare parts"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
