import React from 'react';
import { Customer, JobCard } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { X, ArrowLeft, User, Building, Phone, Mail, MapPin, FileText, Plus, Calendar, DollarSign, ExternalLink } from 'lucide-react';

interface CustomerProfileModalProps {
  isOpen: boolean;
  customer?: Customer;
  customerJobCards: JobCard[];
  onClose: () => void;
  onEditCustomer: (customer: Customer) => void;
  onCreateJobCardForCustomer: (customer: Customer) => void;
  onSelectJobCard: (jobCard: JobCard) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  customer,
  customerJobCards,
  onClose,
  onEditCustomer,
  onCreateJobCardForCustomer,
  onSelectJobCard,
}) => {
  if (!isOpen || !customer) return null;

  const totalOrders = customerJobCards.length;
  const totalSpend = customerJobCards.reduce((acc, j) => acc + j.billing.sellingPrice, 0);
  const totalPaid = customerJobCards.reduce((acc, j) => acc + j.billing.advancePaid, 0);
  const totalBalance = customerJobCards.reduce((acc, j) => acc + j.billing.balanceAmount, 0);

  const sortedJobs = [...customerJobCards].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const lastOrderDate = sortedJobs.length > 0 ? new Date(sortedJobs[0].createdAt).toLocaleDateString() : 'No Orders Yet';

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-900 text-white p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all"
              title="Go back to customer list"
            >
              <ArrowLeft className="w-4 h-4 text-sky-300" />
              <span>Back</span>
            </button>

            <button
              onClick={onClose}
              className="text-navy-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner font-bold text-xl">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{customer.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[11px] font-semibold">
                    {customer.customerCode}
                  </span>
                </div>
                <p className="text-xs text-sky-200 mt-0.5 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 inline" /> {customer.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditCustomer(customer)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all"
              >
                Edit Info
              </button>
              <button
                onClick={() => onCreateJobCardForCustomer(customer)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-navy-950 text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Order</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Total Orders</p>
              <p className="text-xl font-black text-navy-900 mt-0.5">{totalOrders}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-[11px] font-semibold text-emerald-700">Total Spend</p>
              <p className="text-xl font-black text-emerald-900 mt-0.5">₹ {totalSpend.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <p className="text-[11px] font-semibold text-amber-700">Outstanding Balance</p>
              <p className="text-xl font-black text-amber-900 mt-0.5">₹ {totalBalance.toLocaleString()}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Last Order Date</p>
              <p className="text-xs font-bold text-slate-800 mt-1.5">{lastOrderDate}</p>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact & Billing Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Primary Phone: <strong className="font-semibold text-slate-900">{customer.phone}</strong></span>
              </div>
              {customer.altPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Alt Phone: <strong>{customer.altPhone}</strong></span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Email: <strong>{customer.email}</strong></span>
                </div>
              )}
              {customer.gstNumber && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>GSTIN: <strong className="font-mono text-navy-800">{customer.gstNumber}</strong></span>
                </div>
              )}
              <div className="sm:col-span-2 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Address: {customer.address}</span>
              </div>
              {customer.notes && (
                <div className="sm:col-span-2 p-2.5 rounded bg-white border border-slate-200 text-slate-600 italic">
                  Notes: "{customer.notes}"
                </div>
              )}
            </div>
          </div>

          {/* Complete Job History Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Complete Order History</h4>
              <span className="text-xs text-slate-400">{sortedJobs.length} records</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-4">Job #</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Price (₹)</th>
                    <th className="p-3 pr-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No orders recorded for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    sortedJobs.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => {
                          onSelectJobCard(job);
                          onClose();
                        }}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="p-3 pl-4 font-mono font-bold text-navy-900">{job.jobNo}</td>
                        <td className="p-3 font-semibold text-slate-800">{job.productName}</td>
                        <td className="p-3 text-slate-500">{job.jobDate}</td>
                        <td className="p-3 font-mono">{job.quantity}</td>
                        <td className="p-3">
                          <StatusBadge status={job.status} size="sm" />
                        </td>
                        <td className="p-3 font-bold text-slate-900">₹ {job.billing.sellingPrice}</td>
                        <td className="p-3 pr-4 text-right">
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-navy-700 inline" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
