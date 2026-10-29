import React, { useRef } from 'react';
import { JobCard, CompanySettings } from '../../types';
import { Printer, Download, QrCode, Scissors, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrintableJobCardProps {
  jobCard: JobCard;
  settings: CompanySettings;
  onClose: () => void;
}

export const PrintableJobCard: React.FC<PrintableJobCardProps> = ({
  jobCard,
  settings,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!cardRef.current) return;
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
          <title>Job Ticket - ${jobCard.jobNo}</title>
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
            ${cardRef.current.innerHTML}
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
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`JobTicket_${jobCard.jobNo}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        <div className="no-print p-4 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all mr-1"
              title="Go back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-300" />
              <span>Back</span>
            </button>
            <Printer className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">Official Job Card Print Ticket</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg ml-1"
            >
              Close
            </button>
          </div>
        </div>

        <div ref={cardRef} className="printable-area p-8 bg-white text-slate-900 space-y-6">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {settings.companyName || 'SAI GRAPHICS'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-xs text-slate-600">
                Phone: {settings.phone} • Email: {settings.email}
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-1">GSTIN: {settings.gstNumber}</p>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-mono font-extrabold tracking-wider">
                JOB TICKET
              </div>
              <p className="text-xl font-black font-mono text-navy-900 mt-2">{jobCard.jobNo}</p>
              <p className="text-xs text-slate-500">Date: {jobCard.jobDate}</p>
              <p className="text-xs font-bold text-rose-700">Delivery: {jobCard.expectedDeliveryDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-300 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</p>
              <p className="font-bold text-sm text-slate-900">{jobCard.customerName}</p>
              <p className="text-slate-600 font-semibold">{jobCard.company}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Phone & Contact</p>
              <p className="font-bold text-slate-900">{jobCard.phone}</p>
              <p className="text-slate-600">Priority: <strong className="uppercase">{jobCard.production.priority}</strong></p>
            </div>
          </div>

          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-2.5 font-bold text-xs uppercase tracking-wider flex justify-between">
              <span>Job Technical Specifications</span>
              <span className="font-mono">{jobCard.jobType}</span>
            </div>

            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-300">
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-600 w-1/3">Product Title</td>
                  <td className="p-2.5 font-black text-sm text-slate-900">{jobCard.productName}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-600">Quantity</td>
                  <td className="p-2.5 font-black text-base text-navy-900 font-mono">{jobCard.quantity} Pcs</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-600">Paper Specs</td>
                  <td className="p-2.5 font-semibold text-slate-900">
                    {jobCard.paperDetails.size} | {jobCard.paperDetails.gsm} | {jobCard.paperDetails.paperType}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-600">Printing Specs</td>
                  <td className="p-2.5 font-semibold text-slate-900">
                    {jobCard.printDetails.printType} • {jobCard.printDetails.sides} • {jobCard.printDetails.colorMode}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-600">Lamination & Binding</td>
                  <td className="p-2.5 font-semibold text-slate-900">
                    Lamination: {jobCard.printDetails.lamination} | Binding: {jobCard.printDetails.binding}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-600">Finishing & Cutting</td>
                  <td className="p-2.5 font-semibold text-slate-900">
                    Cutting: {jobCard.printDetails.cutting} | Finishing: {jobCard.printDetails.finishing}
                  </td>
                </tr>
                {jobCard.printDetails.specialInstructions && (
                  <tr className="bg-amber-50">
                    <td className="p-2.5 font-bold text-amber-900">Special Instructions</td>
                    <td className="p-2.5 font-bold text-amber-900">{jobCard.printDetails.specialInstructions}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 border border-slate-300 rounded-lg">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Operator Assignment</p>
              <p className="font-bold text-slate-900 mt-1">Assigned To: {jobCard.production.assignedTo}</p>
              <p className="text-slate-600">Machine: {jobCard.production.machineUsed || 'Standard Press'}</p>
            </div>

            <div className="p-3 border border-slate-300 rounded-lg bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Billing Summary</p>
              {jobCard.billing.billNo && (
                <p className="text-xs font-bold text-navy-800 mb-1">Bill No: {jobCard.billing.billNo}</p>
              )}
              <div className="mt-1 flex justify-between font-medium">
                <span>Total Amount:</span>
                <span className="font-bold">₹ {jobCard.billing.sellingPrice}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Advance Paid:</span>
                <span className="text-emerald-700 font-bold">₹ {jobCard.billing.advancePaid}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-navy-900 border-t border-slate-300 pt-1 mt-1">
                <span>Balance Due:</span>
                <span className="text-rose-700">₹ {jobCard.billing.balanceAmount}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t-2 border-dashed border-slate-400 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5" /> Cut Here - Customer Delivery Slip
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900 uppercase">{settings.companyName || 'SAI GRAPHICS'}</p>
                <p className="text-[10px] text-slate-500">Customer Claim Slip • Job #{jobCard.jobNo}</p>
                <p className="text-xs font-bold text-slate-800 mt-1">Client: {jobCard.customerName} ({jobCard.company})</p>
                <p className="text-xs text-slate-700">Product: {jobCard.productName} ({jobCard.quantity} Pcs)</p>
                <p className="text-xs font-bold text-amber-700 mt-0.5">Balance to Pay at Pickup: ₹ {jobCard.billing.balanceAmount}</p>
              </div>

              <div className="text-center border p-2 rounded bg-slate-50">
                <QrCode className="w-12 h-12 text-slate-800 mx-auto" />
                <p className="text-[9px] font-mono font-bold text-slate-500 mt-1">{jobCard.jobNo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
