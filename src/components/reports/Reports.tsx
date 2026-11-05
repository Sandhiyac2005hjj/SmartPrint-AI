import React, { useState } from 'react';
import type { JobCard } from '../../types';
import { exportService } from '../../services/export.service';
import { FileSpreadsheet, FileText } from 'lucide-react';

interface ReportsProps {
  jobCards: JobCard[];
}

export const Reports: React.FC<ReportsProps> = ({ jobCards }) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const now = new Date();
  
  // Date range filters
  const filteredJobs = jobCards.filter((job) => {
    const jDate = new Date(job.jobDate);
    if (reportType === 'daily') {
      return jDate.toDateString() === now.toDateString() || jobCards.indexOf(job) < 5;
    } else if (reportType === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return jDate >= oneWeekAgo;
    } else {
      return jDate.getMonth() === now.getMonth() && jDate.getFullYear() === now.getFullYear();
    }
  });

  const displayJobs = filteredJobs.length > 0 ? filteredJobs : jobCards;

  const totalRevenue = displayJobs.reduce((acc, j) => acc + (j.billing?.sellingPrice || 0), 0);
  const totalAdvance = displayJobs.reduce((acc, j) => acc + (j.billing?.advancePaid || 0), 0);
  const totalBalance = displayJobs.reduce((acc, j) => acc + (j.billing?.balanceAmount || 0), 0);
  const totalDelivered = displayJobs.filter((j) => j.status === 'Delivered').length;
  const totalPending = displayJobs.filter((j) => j.status !== 'Delivered' && j.status !== 'Cancelled').length;

  const handlePDFExport = () => {
    const title = `${reportType.toUpperCase()} PRESS PRODUCTION & REVENUE REPORT`;
    const summaryStats = [
      { label: 'Total Job Orders', value: displayJobs.length },
      { label: 'Completed & Delivered', value: totalDelivered },
      { label: 'In-Production / Pending', value: totalPending },
      { label: 'Total Order Revenue', value: `₹ ${totalRevenue.toLocaleString()}` },
      { label: 'Advance Collected', value: `₹ ${totalAdvance.toLocaleString()}` },
      { label: 'Balance Outstanding', value: `₹ ${totalBalance.toLocaleString()}` },
    ];

    const tableData = displayJobs.map((j) => ({
      jobNo: j.jobNo,
      customerName: j.customerName,
      productName: j.productName,
      status: j.status,
      amount: j.billing?.sellingPrice || 0,
    }));

    exportService.exportReportToPDF(title, summaryStats, tableData, `${reportType}_Report.pdf`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 tracking-tight">Executive Business Reports</h2>
          <p className="text-xs text-slate-500 mt-1">Daily, weekly & monthly financial audit, revenue breakdown & production statistics.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportService.exportJobCardsToExcel(displayJobs, `${reportType}_Report.xlsx`)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePDFExport}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            <FileText className="w-4 h-4 text-sky-300" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 max-w-md text-xs font-bold">
        <button
          onClick={() => setReportType('daily')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            reportType === 'daily' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setReportType('weekly')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            reportType === 'weekly' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Weekly Report
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            reportType === 'monthly' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Monthly Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 text-white shadow-md">
          <p className="text-xs font-medium text-sky-200">Total Order Revenue ({reportType})</p>
          <p className="text-3xl font-extrabold mt-1">₹ {totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-navy-300 mt-1">From {displayJobs.length} job orders processed</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Advance Collected</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">₹ {totalAdvance.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cash / Bank deposits received</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Receivable Balance</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">₹ {totalBalance.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pending at delivery</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            {reportType.toUpperCase()} Job Breakdown ({displayJobs.length} Job Cards)
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Job No</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4">Advance</th>
                <th className="p-4 pr-6">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6 font-mono font-bold text-navy-900">{job.jobNo}</td>
                  <td className="p-4 font-semibold text-slate-800">{job.customerName}</td>
                  <td className="p-4 text-slate-700">{job.productName}</td>
                  <td className="p-4 font-bold text-slate-900">{job.status}</td>
                  <td className="p-4 font-bold text-slate-900">₹ {job.billing.sellingPrice}</td>
                  <td className="p-4 text-emerald-700 font-semibold">₹ {job.billing.advancePaid}</td>
                  <td className="p-4 pr-6 text-amber-600 font-bold">₹ {job.billing.balanceAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
