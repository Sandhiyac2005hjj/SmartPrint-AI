import React, { useState } from 'react';
import { Customer, JobCard } from '../../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  Building, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { exportService } from '../../services/export.service';

interface CustomerListProps {
  customers: Customer[];
  jobCards: JobCard[];
  onOpenAddModal: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onViewCustomerProfile: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  jobCards,
  onOpenAddModal,
  onEditCustomer,
  onDeleteCustomer,
  onViewCustomerProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Filter customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startRecord = filteredCustomers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(filteredCustomers.length, currentPage * itemsPerPage);

  const getCustomerStats = (customerId: string) => {
    const cJobs = jobCards.filter((j) => j.customerId === customerId);
    const totalOrders = cJobs.length;
    const totalSpent = cJobs.reduce((acc, j) => acc + j.billing.sellingPrice, 0);
    return { totalOrders, totalSpent };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Permanent client profiles, order history & contact specifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportService.exportCustomersToExcel(customers)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white text-xs font-semibold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4 text-sky-300" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer name, company, phone or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-navy-600 focus:ring-2 focus:ring-navy-100 rounded-xl text-xs outline-none transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredCustomers.length} Customers
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="p-4 pl-6">Customer Code & Name</th>
                <th className="p-4">Company</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No customers found. Click "Add New Customer" to create one.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => {
                  const stats = getCustomerStats(cust.id);
                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onViewCustomerProfile(cust)}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy-50 text-navy-800 border border-navy-100 font-bold flex items-center justify-center shrink-0">
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-navy-950 text-xs">{cust.name}</p>
                            <span className="text-[10px] font-mono text-slate-400 font-medium">{cust.customerCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.company}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {cust.phone}
                        </p>
                        {cust.email && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" /> {cust.email}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                          {stats.totalOrders} jobs
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-700">
                        ₹ {stats.totalSpent.toLocaleString()}
                      </td>
                      <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewCustomerProfile(cust)}
                            title="View Customer Profile"
                            className="p-2 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-200 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditCustomer(cust)}
                            title="Edit Customer"
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteCustomer(cust.id)}
                            title="Delete Customer"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Scalable Pagination */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-slate-900">{startRecord}–{endRecord}</strong> of <strong className="text-slate-900">{filteredCustomers.length}</strong> customers
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
  );
};
