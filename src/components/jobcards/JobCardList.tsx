import React, { useState } from 'react';
import { JobCard, JobStatus, PriorityLevel } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
  X,
  Receipt,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { exportService } from '../../services/export.service';
import { storageService } from '../../services/storage.service';
import { PrintableInvoice } from '../billing/PrintableInvoice';

interface JobCardListProps {
  jobCards: JobCard[];
  initialFilterStatus?: JobStatus;
  onOpenCreateModal: () => void;
  onSelectJobCard: (jobCard: JobCard) => void;
  onEditJobCard: (jobCard: JobCard) => void;
  onDuplicateJobCard: (id: string) => void;
  onDeleteJobCard: (id: string) => void;
}

export const JobCardList: React.FC<JobCardListProps> = ({
  jobCards,
  initialFilterStatus,
  onOpenCreateModal,
  onSelectJobCard,
  onEditJobCard,
  onDuplicateJobCard,
  onDeleteJobCard,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialFilterStatus || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('All');
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceModalJob, setInvoiceModalJob] = useState<JobCard | undefined>(undefined);

  const settings = storageService.getSettings();

  const tabs = ['All', 'Active', 'Pending', 'Designing', 'Printing', 'Finishing', 'Ready', 'Delivered', 'Cancelled'];

  // Filter Logic
  const filteredJobs = jobCards.filter((job) => {
    // Tab filter
    if (activeTab === 'Active') {
      if (job.status === 'Delivered' || job.status === 'Cancelled') return false;
    } else if (activeTab !== 'All') {
      if (job.status !== activeTab) return false;
    }

    // Priority filter
    if (priorityFilter !== 'All' && job.production?.priority !== priorityFilter) return false;

    // Job Type filter
    if (jobTypeFilter !== 'All' && job.jobType !== jobTypeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = job.jobNo.toLowerCase().includes(q);
      const matchCust = job.customerName.toLowerCase().includes(q);
      const matchComp = job.company.toLowerCase().includes(q);
      const matchPhone = job.phone.toLowerCase().includes(q);
      const matchProd = job.productName.toLowerCase().includes(q);
      const matchType = job.jobType.toLowerCase().includes(q);
      const matchStatus = job.status.toLowerCase().includes(q);
      if (!matchNo && !matchCust && !matchComp && !matchPhone && !matchProd && !matchType && !matchStatus) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const startRecord = filteredJobs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(filteredJobs.length, currentPage * itemsPerPage);

  const resetFilters = () => {
    setActiveTab('All');
    setSearchQuery('');
    setPriorityFilter('All');
    setJobTypeFilter('All');
    setCurrentPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 tracking-tight">Job Card Management Hub</h2>
          <p className="text-xs text-slate-500 mt-1">Track print job tickets, paper specs, operator assignments & delivery dates.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportService.exportJobCardsToExcel(filteredJobs)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white text-xs font-semibold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-sky-300" />
            <span>New Job Card</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        {tabs.map((tab) => {
          const count =
            tab === 'All'
              ? jobCards.length
              : tab === 'Active'
              ? jobCards.filter((j) => j.status !== 'Delivered' && j.status !== 'Cancelled').length
              : jobCards.filter((j) => j.status === tab).length;

          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-t-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-navy-900 text-white shadow-sm border-b-2 border-sky-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-sky-500 text-navy-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Job #, Customer, Product, Status..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-navy-600 focus:ring-2 focus:ring-navy-100 rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent 🔥</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-500">Job Category:</span>
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Visiting Card">Visiting Card</option>
              <option value="Banner / Flex">Banner / Flex</option>
              <option value="Brochure / Flyer">Brochure / Flyer</option>
              <option value="Packaging Box">Packaging Box</option>
              <option value="Vinyl Sticker / Decal">Vinyl Sticker</option>
            </select>
          </div>

          {(priorityFilter !== 'All' || jobTypeFilter !== 'All' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Job Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="p-4 pl-6">Job No & Date</th>
                <th className="p-4">Customer & Company</th>
                <th className="p-4">Product & Specs</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Delivery Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No matching Job Cards found. Click "New Job Card" to create one.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJobCard(job)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-mono font-bold text-navy-950 text-xs">{job.jobNo}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{job.jobDate}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{job.customerName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{job.company}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{job.productName}</p>
                      <p className="text-[10px] text-slate-400">
                        {job.jobType} • {job.quantity} Pcs {job.paperDetails?.gsm ? `(${job.paperDetails.gsm})` : ''}
                      </p>
                    </td>
                    <td className="p-4">
                      {job.production?.priority && <PriorityBadge priority={job.production.priority} />}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{job.expectedDeliveryDate}</p>
                      {job.predictedCompletionDate && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            title={`AI Predicted Completion: ${job.predictedCompletionDate} (${job.predictedDays || '?'} production days)`}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>AI: {job.predictedCompletionDate}</span>
                          </span>
                          {job.status !== 'Delivered' &&
                            job.status !== 'Cancelled' &&
                            job.predictedCompletionDate > job.expectedDeliveryDate && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                title="Predicted completion exceeds promised delivery date! Expedite required."
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                <span>Expedite</span>
                              </span>
                            )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={job.status} size="sm" />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-navy-900">₹ {job.billing?.sellingPrice ?? 0}</p>
                      {(job.billing?.balanceAmount ?? 0) > 0 ? (
                        <p className="text-[10px] text-amber-600 font-medium">Bal: ₹ {job.billing?.balanceAmount}</p>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">Fully Paid</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInvoiceModalJob(job)}
                          title="Generate Official GST Tax Invoice"
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded-lg transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => onSelectJobCard(job)}
                          title="View Details & Timeline"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditJobCard(job)}
                          title="Edit Job Card"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateJobCard(job.id)}
                          title="Duplicate Order"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteJobCard(job.id)}
                          title="Delete Job Card"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Scalable Pagination */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-slate-900">{startRecord}–{endRecord}</strong> of <strong className="text-slate-900">{filteredJobs.length}</strong> records
            </span>
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
              <span className="text-slate-400 font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 outline-none"
              >
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, array) => {
                const prevPage = array[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        currentPage === page
                          ? 'bg-navy-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tax Invoice Generator Modal */}
      {invoiceModalJob && (
        <PrintableInvoice
          jobCard={invoiceModalJob}
          settings={settings}
          onClose={() => setInvoiceModalJob(undefined)}
        />
      )}
    </div>
  );
};
