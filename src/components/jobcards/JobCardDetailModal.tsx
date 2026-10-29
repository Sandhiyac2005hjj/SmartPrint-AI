import React, { useState } from 'react';
import { JobCard, JobStatus, CompanySettings } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { JobCardTimeline } from './JobCardTimeline';
import { PrintableJobCard } from './PrintableJobCard';
import { PrintableInvoice } from '../billing/PrintableInvoice';
import { 
  X, 
  ArrowLeft,
  Printer, 
  Copy, 
  Edit3, 
  Trash2, 
  Paperclip, 
  FileText, 
  Download, 
  Upload, 
  User, 
  Building, 
  Phone, 
  Calendar, 
  DollarSign, 
  Scissors,
  CheckCircle2,
  FileCheck,
  Receipt
} from 'lucide-react';

interface JobCardDetailModalProps {
  isOpen: boolean;
  jobCard?: JobCard;
  settings: CompanySettings;
  onClose: () => void;
  onEdit: (jobCard: JobCard) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: JobStatus, note?: string) => void;
  onFileUpload: (jobCardId: string, file: { name: string; size: number; type: string; dataUrl: string }) => void;
  onFileDelete: (jobCardId: string, fileId: string) => void;
}

export const JobCardDetailModal: React.FC<JobCardDetailModalProps> = ({
  isOpen,
  jobCard,
  settings,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateStatus,
  onFileUpload,
  onFileDelete,
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !jobCard) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    setIsUploading(true);

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onFileUpload(jobCard.id, {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
      });
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all mr-1"
                title="Go back to list"
              >
                <ArrowLeft className="w-4 h-4 text-sky-300" />
                <span>Back</span>
              </button>
              <div className="px-2.5 py-1 bg-white/10 rounded-lg text-sky-300 font-mono font-bold text-sm">
                {jobCard.jobNo}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{jobCard.productName}</h3>
                <p className="text-xs text-sky-200">
                  {jobCard.customerName} ({jobCard.company})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
                title="Generate Official GST Tax Invoice"
              >
                <Receipt className="w-4 h-4 text-emerald-200" />
                <span>Tax Invoice</span>
              </button>
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all"
              >
                <Printer className="w-4 h-4 text-sky-300" />
                <span>Print Ticket</span>
              </button>
              <button
                onClick={() => onDuplicate(jobCard.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all"
              >
                <Copy className="w-4 h-4 text-sky-300" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => onEdit(jobCard)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-navy-950 text-xs font-bold rounded-lg transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button onClick={onClose} className="text-navy-300 hover:text-white transition-colors ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            {/* Status & Priority Highlight Strip */}
            <div className="flex flex-wrap items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Current Job Status</span>
                  <StatusBadge status={jobCard.status} size="lg" />
                </div>
                <div className="border-l border-slate-300 pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Priority</span>
                  <PriorityBadge priority={jobCard.production.priority} />
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Job Date</span>
                  <span className="font-semibold text-slate-800">{jobCard.jobDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected Delivery</span>
                  <span className="font-bold text-rose-600">{jobCard.expectedDeliveryDate}</span>
                </div>
              </div>
            </div>

            {/* Visual Timeline Component */}
            <JobCardTimeline jobCard={jobCard} onUpdateStatus={onUpdateStatus} />

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Paper & Print Specs */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <Scissors className="w-4 h-4 text-navy-700" /> Paper & Print Technical Details
                </h4>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Job Category</span>
                    <strong className="text-slate-900">{jobCard.jobType}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Quantity</span>
                    <strong className="text-navy-900 font-mono text-sm">{jobCard.quantity} Pcs</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Paper Stock Size</span>
                    <span>{jobCard.paperDetails.size}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">GSM Weight</span>
                    <span>{jobCard.paperDetails.gsm}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Paper Material</span>
                    <span>{jobCard.paperDetails.paperType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Printing Machine</span>
                    <span>{jobCard.printDetails.printType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Print Sides</span>
                    <span>{jobCard.printDetails.sides}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Color Profile</span>
                    <span>{jobCard.printDetails.colorMode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Lamination</span>
                    <span>{jobCard.printDetails.lamination}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Binding & Cutting</span>
                    <span>{jobCard.printDetails.binding} / {jobCard.printDetails.cutting}</span>
                  </div>
                </div>

                {jobCard.printDetails.specialInstructions && (
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                    Special Note: "{jobCard.printDetails.specialInstructions}"
                  </div>
                )}
              </div>

              {/* Customer & Billing Box */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                    <User className="w-4 h-4 text-navy-700" /> Customer Information
                  </h4>

                  <div className="space-y-2 text-slate-700">
                    <p className="font-bold text-slate-900 text-sm">{jobCard.customerName}</p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> {jobCard.company}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {jobCard.phone}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-navy-900 to-navy-950 text-white p-4 rounded-xl shadow-sm space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-sky-300 flex items-center gap-2 border-b border-navy-800 pb-2">
                    <DollarSign className="w-4 h-4" /> Billing Summary
                  </h4>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Selling Price:</span>
                    <span className="font-bold text-base">₹ {jobCard.billing.sellingPrice}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Advance Paid:</span>
                    <span className="font-bold text-emerald-400">₹ {jobCard.billing.advancePaid}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-navy-800 pt-2 font-black">
                    <span className="text-sky-200">Balance Receivable:</span>
                    <span className="text-amber-300 text-base">₹ {jobCard.billing.balanceAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* File Attachments Hub */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-navy-700" /> Artwork & Print File Attachments ({jobCard.files?.length || 0})
                </h4>

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs rounded-lg cursor-pointer transition-all shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-navy-700" />
                  <span>{isUploading ? 'Uploading...' : 'Attach File (PDF, AI, PSD, CDR, ZIP)'}</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.ai,.psd,.cdr,.zip"
                    className="hidden"
                  />
                </label>
              </div>

              {jobCard.files?.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                  No artwork or production files attached yet. Attach vector PDF, CDR or AI files above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {jobCard.files.map((file) => (
                    <div key={file.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-navy-700 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-900 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={file.fileUrl}
                          download={file.name}
                          className="p-1.5 rounded text-navy-700 hover:bg-navy-50"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onFileDelete(jobCard.id, file.id)}
                          className="p-1.5 rounded text-rose-500 hover:bg-rose-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Delete Button */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => onDelete(jobCard.id)}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Job Card Record</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white font-semibold rounded-xl"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Job Ticket Modal overlay */}
      {showPrintModal && (
        <PrintableJobCard
          jobCard={jobCard}
          settings={settings}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Official Tax Invoice Generator Modal overlay */}
      {showInvoiceModal && (
        <PrintableInvoice
          jobCard={jobCard}
          settings={settings}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </>
  );
};
