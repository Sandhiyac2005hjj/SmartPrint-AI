import React, { useRef, useState } from 'react';
import { JobCard, CompanySettings, Customer } from '../../types';
import { Printer, Download, ArrowLeft, X, FileText, CheckCircle2, Building, Phone, Mail, QrCode, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrintableInvoiceProps {
  jobCard: JobCard;
  settings: CompanySettings;
  customer?: Customer;
  onClose: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  jobCard,
  settings,
  customer,
  onClose,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceNo = jobCard.billing.billNo || `INV-${jobCard.jobNo}`;
  const invoiceDate = jobCard.jobDate;
  const sellingPrice = jobCard.billing.sellingPrice || 0;
  const advancePaid = jobCard.billing.advancePaid || 0;
  const balanceDue = jobCard.billing.balanceAmount || 0;

  // Standard 18% GST Breakdown (9% CGST + 9% SGST for commercial printing services)
  const taxableValue = Math.round((sellingPrice / 1.18) * 100) / 100;
  const cgstAmount = Math.round(((sellingPrice - taxableValue) / 2) * 100) / 100;
  const sgstAmount = Math.round(((sellingPrice - taxableValue) / 2) * 100) / 100;

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const stylesHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoiceNo}</title>
          ${stylesHtml}
          <style>
            body { background: white !important; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
            .printable-area { margin: 0 auto; max-width: 800px; }
            @media print {
              body { padding: 0 !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="printable-area">
            ${invoiceRef.current.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`Tax_Invoice_${invoiceNo}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Converts numerical values to official written Indian Rupees format
  const numberToWords = (num: number): string => {
    if (num <= 0) return 'Zero Rupees Only';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    };

    return inWords(Math.floor(num)) + ' Rupees Only';
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Action Toolbar Header (Hidden on Print) */}
        <div className="no-print p-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all"
              title="Return to application"
            >
              <ArrowLeft className="w-4 h-4 text-sky-300" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 border-l border-white/20 pl-3">
              <FileText className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="font-bold text-sm text-white">GST Tax Invoice #{invoiceNo}</h3>
                <p className="text-[11px] text-sky-200">Customer: {jobCard.customerName} ({jobCard.company})</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>Download PDF Invoice</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-navy-300 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-slate-100 flex-1">
          {/* --- AUTHENTIC REAL-WORLD GST TAX INVOICE CONTAINER --- */}
          <div ref={invoiceRef} className="printable-area p-8 sm:p-10 bg-white text-slate-900 font-sans text-xs leading-tight shadow-xl rounded-lg mx-auto max-w-3xl">
            <div className="border-2 border-slate-900 rounded-lg p-6 space-y-5 bg-white">
              {/* Top Invoice Banner Title */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <span className="text-xs font-mono font-black tracking-widest uppercase px-4 py-1 bg-slate-900 text-white rounded">
                  TAX INVOICE
                </span>
                <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
                  Issued under Rule 46 of Central Goods and Services Tax Rules, 2017
                </p>
              </div>

              {/* Seller Branding & Document Meta Header */}
              <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-900 pb-4">
                {/* Seller / Press Info */}
                <div className="col-span-7 space-y-1">
                  <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                    {settings.companyName || 'SAI GRAPHICS & OFFSET PRESS'}
                  </h1>
                  <p className="text-xs text-slate-700 font-medium">{settings.address}</p>
                  <p className="text-xs text-slate-700">
                    Phone: <strong className="text-slate-900">{settings.phone}</strong> • Email: <strong className="text-slate-900">{settings.email}</strong>
                  </p>
                  <div className="pt-1 flex items-center gap-4 text-xs">
                    <span>GSTIN: <strong className="font-mono text-slate-950 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">{settings.gstNumber || '33AAAAA0000A1Z5'}</strong></span>
                    <span>State Code: <strong className="font-mono">33 (Tamil Nadu)</strong></span>
                  </div>
                </div>

                {/* Invoice Numbers & Dates */}
                <div className="col-span-5 border-l border-slate-300 pl-4 space-y-1 text-right">
                  <div className="p-2 bg-slate-50 border border-slate-300 rounded text-left font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold text-[10px]">INVOICE NO:</span>
                      <strong className="text-slate-950 font-black">{invoiceNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold text-[10px]">INVOICE DATE:</span>
                      <strong className="text-slate-900">{invoiceDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold text-[10px]">JOB CARD NO:</span>
                      <strong className="text-navy-900">{jobCard.jobNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold text-[10px]">DELIVERY DATE:</span>
                      <strong className="text-slate-900">{jobCard.expectedDeliveryDate}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To / Party Details Grid */}
              <div className="grid grid-cols-2 gap-4 border border-slate-900 rounded p-3.5 bg-slate-50/60">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Details of Receiver (Billed To)</p>
                  <p className="font-extrabold text-sm text-slate-950">{jobCard.customerName}</p>
                  <p className="font-bold text-slate-800">{jobCard.company}</p>
                  <p className="text-slate-700 mt-1">Phone: <strong>{jobCard.phone}</strong></p>
                  {customer?.email && <p className="text-slate-600">Email: {customer.email}</p>}
                  {customer?.address && <p className="text-slate-600 mt-0.5">Address: {customer.address}</p>}
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">GST & Dispatch Details</p>
                  <p className="font-mono text-xs">
                    Party GSTIN: <strong className="text-slate-950 font-bold">{customer?.gstNumber || 'Unregistered / Retail'}</strong>
                  </p>
                  <p className="text-slate-700">Place of Supply: <strong>33 - Tamil Nadu</strong></p>
                  <p className="text-slate-700">Order Category: <strong>{jobCard.jobType}</strong></p>
                  <div className="pt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      balanceDue === 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      Payment Status: {balanceDue === 0 ? 'PAID IN FULL' : 'PARTIAL / BALANCE RECEIVABLE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Goods & Printing Services Table */}
              <div className="border border-slate-900 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2.5 pl-3 border-r border-slate-700 w-10 text-center">S.No</th>
                      <th className="p-2.5 border-r border-slate-700">Description of Goods & Printing Specs</th>
                      <th className="p-2.5 border-r border-slate-700 text-center w-20">HSN/SAC</th>
                      <th className="p-2.5 border-r border-slate-700 text-center w-24">Quantity</th>
                      <th className="p-2.5 border-r border-slate-700 text-right w-24">Rate (₹)</th>
                      <th className="p-2.5 pr-3 text-right w-28">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    <tr className="min-h-[120px]">
                      <td className="p-3 pl-3 text-center font-mono font-bold border-r border-slate-300 align-top">1</td>
                      <td className="p-3 border-r border-slate-300 align-top space-y-1">
                        <p className="font-black text-slate-950 text-xs">{jobCard.productName}</p>
                        <p className="text-[11px] text-slate-700">
                          Paper Stock: <strong>{jobCard.paperDetails.size} ({jobCard.paperDetails.gsm}) {jobCard.paperDetails.paperType}</strong>
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Print Process: {jobCard.printDetails.printType} • {jobCard.printDetails.sides} • {jobCard.printDetails.colorMode}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Finishing: Lamination ({jobCard.printDetails.lamination}), Binding ({jobCard.printDetails.binding}), Cutting ({jobCard.printDetails.cutting})
                        </p>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold border-r border-slate-300 align-top">4911</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 border-r border-slate-300 align-top">{jobCard.quantity} Pcs</td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-300 align-top">
                        ₹ {(taxableValue / Math.max(1, jobCard.quantity)).toFixed(2)}
                      </td>
                      <td className="p-3 pr-3 text-right font-mono font-bold text-slate-950 align-top">
                        ₹ {taxableValue.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="p-2.5 bg-slate-50 border border-slate-900 rounded flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Amount in Words:</span>
                <strong className="text-slate-950 italic font-bold">{numberToWords(sellingPrice)}</strong>
              </div>

              {/* GST Tax Calculation & Bank Info Grid */}
              <div className="grid grid-cols-12 gap-4">
                {/* Bank & Payment Details (Left 7 Cols) */}
                <div className="col-span-7 border border-slate-900 rounded p-3 bg-white space-y-2">
                  <p className="font-black text-slate-900 uppercase text-[10px] tracking-wider border-b pb-1">
                    Bank Details for Electronic Transfer / NEFT / UPI
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-slate-500">Bank Name:</p>
                      <p className="font-bold text-slate-900">HDFC Bank Ltd</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Account Name:</p>
                      <p className="font-bold text-slate-900">{settings.companyName || 'SAI GRAPHICS PRESS'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Account No:</p>
                      <p className="font-mono font-bold text-slate-950">50200098765432</p>
                    </div>
                    <div>
                      <p className="text-slate-500">IFSC Code:</p>
                      <p className="font-mono font-bold text-slate-950">HDFC0001234</p>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span>UPI Payment ID: <strong className="font-mono text-sky-800 font-bold">saigraphics@upi</strong></span>
                    <span className="text-[10px] text-slate-400 font-semibold">GPay / PhonePe / Paytm</span>
                  </div>
                </div>

                {/* Tax Calculations Box (Right 5 Cols) */}
                <div className="col-span-5 border border-slate-900 rounded overflow-hidden text-xs bg-slate-50">
                  <div className="p-2 flex justify-between border-b border-slate-300">
                    <span className="text-slate-600 font-medium">Taxable Amount:</span>
                    <span className="font-mono font-bold text-slate-900">₹ {taxableValue.toLocaleString()}</span>
                  </div>
                  <div className="p-2 flex justify-between border-b border-slate-300 text-slate-600">
                    <span>CGST @ 9%:</span>
                    <span className="font-mono font-semibold">₹ {cgstAmount.toLocaleString()}</span>
                  </div>
                  <div className="p-2 flex justify-between border-b border-slate-300 text-slate-600">
                    <span>SGST @ 9%:</span>
                    <span className="font-mono font-semibold">₹ {sgstAmount.toLocaleString()}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-200 border-b border-slate-900 font-black text-slate-950">
                    <span>Total Invoice Value:</span>
                    <span className="font-mono text-sm">₹ {sellingPrice.toLocaleString()}</span>
                  </div>
                  <div className="p-2 flex justify-between text-emerald-800 font-bold border-b border-slate-300">
                    <span>Less Advance Paid:</span>
                    <span className="font-mono">₹ {advancePaid.toLocaleString()}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-rose-50 text-rose-800 font-black text-sm">
                    <span>Balance Receivable:</span>
                    <span className="font-mono">₹ {balanceDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions + Authorised Signatory */}
              <div className="grid grid-cols-12 gap-4 pt-2 border-t border-slate-400 items-end text-[10px] text-slate-600">
                <div className="col-span-7 space-y-1">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">Declaration & Terms</p>
                  <p>1. We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.</p>
                  <p>2. Payment due immediately upon delivery unless agreed otherwise.</p>
                  <p>3. Goods once delivered cannot be returned.</p>
                </div>

                <div className="col-span-5 text-right space-y-10">
                  <p className="font-bold text-slate-950 uppercase text-[11px]">
                    For {settings.companyName || 'SAI GRAPHICS & OFFSET PRESS'}
                  </p>
                  <div className="border-t border-slate-900 w-44 ml-auto pt-1 text-center font-bold text-slate-900 uppercase text-[9px]">
                    Authorised Signatory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
          >
            Close View
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>Download PDF Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
