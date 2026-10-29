import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, UserPlus, X, FileText, User, ArrowRight } from 'lucide-react';
import { JobCard, Customer } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface HeaderProps {
  onOpenNewJobCard?: () => void;
  onOpenNewCustomer?: () => void;
  jobCards: JobCard[];
  customers: Customer[];
  onSelectJobCard: (jobCard: JobCard) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const Header: React.FC<HeaderProps> = ({
  jobCards,
  customers,
  onSelectJobCard,
  onSelectCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenResults, setIsOpenResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpenResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const queryLower = searchQuery.toLowerCase().trim();

  // Instant Search Filtering
  const matchingJobCards = queryLower
    ? jobCards.filter(
        (j) =>
          j.jobNo.toLowerCase().includes(queryLower) ||
          j.customerName.toLowerCase().includes(queryLower) ||
          j.company.toLowerCase().includes(queryLower) ||
          j.phone.toLowerCase().includes(queryLower) ||
          j.productName.toLowerCase().includes(queryLower) ||
          j.jobType.toLowerCase().includes(queryLower) ||
          j.status.toLowerCase().includes(queryLower)
      ).slice(0, 5)
    : [];

  const matchingCustomers = queryLower
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(queryLower) ||
          c.company.toLowerCase().includes(queryLower) ||
          c.phone.toLowerCase().includes(queryLower) ||
          c.customerCode.toLowerCase().includes(queryLower)
      ).slice(0, 5)
    : [];

  const totalResults = matchingJobCards.length + matchingCustomers.length;

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Global Search Input */}
      <div className="relative w-full max-w-lg" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpenResults(true);
            }}
            onFocus={() => setIsOpenResults(true)}
            placeholder="Global Search (Job Card #, Customer Name, Phone, Product, Status)..."
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-navy-600 focus:ring-2 focus:ring-navy-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsOpenResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpenResults && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
            {totalResults === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching Job Cards or Customers found for <span className="font-semibold">"{searchQuery}"</span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {/* Job Cards Matches */}
                {matchingJobCards.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Job Cards ({matchingJobCards.length})
                    </p>
                    {matchingJobCards.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          onSelectJobCard(job);
                          setIsOpenResults(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-navy-50 border border-navy-100 text-navy-800 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-navy-900">{job.jobNo}</span>
                              <span className="text-xs font-medium text-slate-700">{job.productName}</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {job.customerName} ({job.company}) • Qty: {job.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={job.status} size="sm" />
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-700 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Matches */}
                {matchingCustomers.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Customers ({matchingCustomers.length})
                    </p>
                    {matchingCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          onSelectCustomer(cust);
                          setIsOpenResults(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900">{cust.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {cust.company} • {cust.phone}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 group-hover:text-emerald-700">
                          View Profile →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Status & Quick Indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Press System Ready</span>
        </div>
      </div>
    </header>
  );
};
