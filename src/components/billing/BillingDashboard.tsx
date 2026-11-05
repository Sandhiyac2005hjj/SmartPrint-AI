import React, { useState } from 'react';
import type { JobCard, PaymentStatus } from '../../types';
import { 
  CreditCard, 
  Search, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { exportService } from '../../services/export.service';
import { storageService } from '../../services/storage.service';
import { QuickPaymentModal } from './QuickPaymentModal';
import { PrintableInvoice } from './PrintableInvoice';

interface BillingDashboardProps {
  jobCards: JobCard[];
  onSelectJobCard: (job: JobCard) => void;
  onUpdatePayment: (jobId: string, advancePaid: number, paymentStatus: PaymentStatus, billNo?: string) => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  jobCards,
  onSelectJobCard,
  onUpdatePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');
  const [paymentModalJob, setPaymentModalJob] = useState<JobCard | undefined>(undefined);
  const [invoiceModalJob, setInvoiceModalJob] = useState<JobCard | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const settings = storageService.getSettings();

  // Financial Calculations across all job cards
  const totalGrossRevenue = jobCards.reduce((sum, j) => sum + (j.billing?.sellingPrice || 0), 0);
  const totalCollected = jobCards.reduce((sum, j) => sum + (j.billing?.advancePaid || 0), 0);
  const totalOutstanding = jobCards.reduce((sum, j) => sum + (j.billing?.balanceAmount || 0), 0);
  const totalEstimatedCost = jobCards.reduce((sum, j) => sum + (j.billing?.estimatedCost || 0), 0);
  const estimatedProfit = Math.max(0, totalGrossRevenue - totalEstimatedCost);
  const profitMarginPercent = totalGrossRevenue > 0 ? Math.round((estimatedProfit / totalGrossRevenue) * 100) : 0;

  // Filtered Jobs
  const filteredJobs = jobCards.filter((j) => {
    const matchesSearch = 
      j.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.billing?.billNo && j.billing.billNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || j.billing?.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const startRecord = filteredJobs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(filteredJobs.length, currentPage * itemsPerPage);

  // Customer Receivables Summary (Top Customers by Outstanding Balance)
  const customerBalancesMap = new Map<string, { name: string; company: string; pendingCount: number; totalBalance: number }>();
  
  jobCards.forEach((j) => {
    if (j.billing.balanceAmount > 0) {
      const existing = customerBalancesMap.get(j.customerId) || {
        name: j.customerName,
        company: j.company,
        pendingCount: 0,
        totalBalance: 0,
      };
      existing.pendingCount += 1;
      existing.totalBalance += j.billing.balanceAmount;
      customerBalancesMap.set(j.customerId, existing);
    }
  });

  const topDebtors = Array.from(customerBalancesMap.values())
    .sort((a, b) => b.totalBalance - a.totalBalance)
    .slice(0, 5);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Paid</span>
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Partial</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Unpaid</span>
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-navy-950 tracking-tight">Billing & Payments Hub</h2>
            <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
              Financial Management
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time press revenue auditing, customer receivables, balance tracking & quick payment collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportService.exportJobCardsToExcel(filteredJobs, `Billing_Statement_${new Date().toISOString().split('T')[0]}.xlsx`)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Statement (Excel)</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-200 uppercase tracking-wider">Total Billed Revenue</span>
            <div className="p-2 rounded-xl bg-navy-800 text-sky-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-3">₹ {totalGrossRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-navy-300 mt-1">From {jobCards.length} job orders created</p>
        </div>

        {/* Collected Payments */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 mt-3">₹ {totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Advances & completed payments</p>
        </div>

        {/* Outstanding Receivables */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Balance</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-rose-600 mt-3">₹ {totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Collectable at delivery</p>
        </div>

        {/* Profit Margin Analysis */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Gross Margin</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-sky-700 mt-3">₹ {estimatedProfit.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Margin: <strong className="text-sky-800 font-extrabold">{profitMarginPercent}%</strong> (Est. Cost ₹{totalEstimatedCost.toLocaleString()})
          </p>
        </div>
      </div>

      {/* Main Layout Grid (Receivables Widget + Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Customer Receivables Breakdown Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-amber-500" />
                <span>Top Customer Dues</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {topDebtors.length} Clients
              </span>
            </div>

            {topDebtors.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <p>No outstanding customer balances!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topDebtors.map((debtor, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-xs truncate max-w-[130px]">{debtor.name}</p>
                      <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        ₹{debtor.totalBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span className="truncate max-w-[120px]">{debtor.company}</span>
                      <span>{debtor.pendingCount} unpaid order{debtor.pendingCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Billing Table & Filters */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 text-xs font-bold w-full md:w-auto">
              {(['All', 'Pending', 'Partial', 'Paid'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    statusFilter === status
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-200'
                  }`}
                >
                  {status === 'All' ? 'All Orders' : status}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Job No, Customer, Bill No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-navy-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Billing Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-navy-600" />
                <span>Job Orders & Billing Records ({filteredJobs.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto max-h-[65vh]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100 sticky top-0 z-10 shadow-2xs">
                  <tr>
                    <th className="p-4 pl-6">Job No & Customer</th>
                    <th className="p-4">Product / Item</th>
                    <th className="p-4">Total Price</th>
                    <th className="p-4">Paid Progress</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No billing records found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedJobs.map((job) => {
                      const price = job.billing.sellingPrice || 0;
                      const paid = job.billing.advancePaid || 0;
                      const balance = job.billing.balanceAmount || 0;
                      const percentPaid = price > 0 ? Math.min(100, Math.round((paid / price) * 100)) : 0;

                      return (
                        <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Job No & Customer */}
                          <td className="p-4 pl-6">
                            <div className="font-mono font-bold text-navy-900">{job.jobNo}</div>
                            <div className="font-semibold text-slate-800 mt-0.5">{job.customerName}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{job.company}</div>
                          </td>

                          {/* Product */}
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{job.productName}</div>
                            <div className="text-[11px] text-slate-400">Qty: {job.quantity}</div>
                            {job.billing.billNo && (
                              <span className="inline-block text-[10px] font-mono text-navy-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 mt-1">
                                {job.billing.billNo}
                              </span>
                            )}
                          </td>

                          {/* Price */}
                          <td className="p-4 font-bold text-slate-900">
                            ₹ {price.toLocaleString()}
                          </td>

                          {/* Payment Progress Bar */}
                          <td className="p-4 min-w-[130px]">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span className="text-emerald-700">₹{paid.toLocaleString()}</span>
                              <span className="text-slate-400">{percentPaid}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full transition-all rounded-full ${
                                  percentPaid === 100 ? 'bg-emerald-500' : percentPaid > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </td>

                          {/* Balance */}
                          <td className="p-4 font-extrabold text-rose-600">
                            ₹ {balance.toLocaleString()}
                          </td>

                          {/* Status Tag */}
                          <td className="p-4">
                            {getStatusBadge(job.billing.paymentStatus)}
                          </td>

                          {/* Actions */}
                          <td className="p-4 pr-6 text-right space-x-1.5">
                            <button
                              onClick={() => setInvoiceModalJob(job)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-[11px] transition-all inline-flex items-center gap-1"
                              title="Generate GST Tax Invoice"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Invoice</span>
                            </button>
                            <button
                              onClick={() => setPaymentModalJob(job)}
                              className="px-2.5 py-1.5 bg-navy-900 hover:bg-navy-950 text-white font-bold rounded-lg text-[11px] transition-all shadow-2xs inline-flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-sky-300" />
                              <span>Payment</span>
                            </button>
                            <button
                              onClick={() => onSelectJobCard(job)}
                              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[11px] transition-all inline-flex items-center"
                              title="View Invoice & Job Details"
                            >
                              <ArrowUpRight className="w-4 h-4 text-slate-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Enhanced Scalable Pagination Footer */}
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
        </div>
      </div>

      {/* Quick Payment Recorder Modal */}
      <QuickPaymentModal
        isOpen={!!paymentModalJob}
        jobCard={paymentModalJob}
        onClose={() => setPaymentModalJob(undefined)}
        onSavePayment={onUpdatePayment}
      />

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
