import React from 'react';
import { JobCard, Customer, ActivityLog, JobStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/StatusBadge';
import { 
  Users, 
  FileText, 
  Clock, 
  Printer, 
  PackageCheck, 
  CheckCircle, 
  Plus, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  Eye
} from 'lucide-react';

interface DashboardProps {
  jobCards: JobCard[];
  customers: Customer[];
  logs: ActivityLog[];
  onOpenNewJobCard: () => void;
  onOpenNewCustomer: () => void;
  onSelectJobCard: (jobCard: JobCard) => void;
  onNavigateToJobCards: (filterStatus?: JobStatus) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  jobCards,
  customers,
  logs,
  onOpenNewJobCard,
  onOpenNewCustomer,
  onSelectJobCard,
  onNavigateToJobCards,
}) => {
  // Counters
  const totalCustomers = customers.length;
  const totalJobCards = jobCards.length;
  const pendingJobs = jobCards.filter((j) => j.status === 'Pending').length;
  const designingJobs = jobCards.filter((j) => j.status === 'Designing').length;
  const printingJobs = jobCards.filter((j) => j.status === 'Printing').length;
  const readyJobs = jobCards.filter((j) => j.status === 'Ready').length;
  const deliveredJobs = jobCards.filter((j) => j.status === 'Delivered').length;

  const totalRevenue = jobCards.reduce((acc, j) => acc + (j.billing?.sellingPrice || 0), 0);
  const totalBalance = jobCards.reduce((acc, j) => acc + (j.billing?.balanceAmount || 0), 0);

  const recentJobs = [...jobCards].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  const statCards = [
    { title: 'Total Customers', count: totalCustomers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', status: undefined },
    { title: 'Total Job Cards', count: totalJobCards, icon: FileText, color: 'text-navy-700', bg: 'bg-navy-50 border-navy-100', status: undefined },
    { title: 'Pending Jobs', count: pendingJobs, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', status: 'Pending' as JobStatus },
    { title: 'Printing Jobs', count: printingJobs, icon: Printer, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', status: 'Printing' as JobStatus },
    { title: 'Ready for Delivery', count: readyJobs, icon: PackageCheck, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100', status: 'Ready' as JobStatus },
    { title: 'Delivered Jobs', count: deliveredJobs, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', status: 'Delivered' as JobStatus },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 tracking-tight">Press Executive Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time print order status, shop floor metrics & customer activity.</p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={onOpenNewJobCard}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white text-xs font-semibold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-sky-300" />
            <span>Create New Job Card</span>
          </button>
        </div>
      </div>

      {/* 6 Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => card.status && onNavigateToJobCards(card.status)}
              className={`p-4 rounded-xl border ${card.bg} transition-all hover:shadow-md cursor-pointer group`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-white shadow-2xs ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {card.status && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-slate-600 truncate">{card.title}</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{card.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue & Balance Quick Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-navy-900 to-navy-800 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-sky-200">Total Order Volume Value</p>
            <p className="text-3xl font-extrabold mt-1">₹ {totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-navy-300 mt-1">Across all active & completed job cards</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
            <TrendingUp className="w-8 h-8 text-sky-300" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Balance Receivable</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">₹ {totalBalance.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-1">Pending payments to collect upon delivery</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <DollarSign className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Job Cards + Shop Floor Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Job Cards Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Job Cards</h3>
              <p className="text-xs text-slate-500">Latest production tickets registered</p>
            </div>
            <button
              onClick={() => onNavigateToJobCards()}
              className="text-xs font-semibold text-navy-700 hover:text-navy-900 flex items-center gap-1"
            >
              <span>View All ({totalJobCards})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3.5 pl-5">Job #</th>
                  <th className="p-3.5">Customer & Company</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No Job Cards created yet. Click "Create New Job Card" to get started.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJobCard(job)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 pl-5 font-mono font-bold text-navy-900">{job.jobNo}</td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{job.customerName}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{job.company}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-medium text-slate-800">{job.productName}</p>
                        <p className="text-[10px] text-slate-400">{job.jobType} • {job.quantity} pcs</p>
                      </td>
                      <td className="p-3.5">
                        <PriorityBadge priority={job.production.priority} />
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={job.status} size="sm" />
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-200 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Log Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Activity className="w-4 h-4 text-navy-700" />
            <h3 className="font-bold text-slate-900 text-sm">Shop Floor Activity Log</h3>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400">No activity recorded yet.</p>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{log.action}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
