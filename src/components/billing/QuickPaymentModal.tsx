import React, { useState, useEffect } from 'react';
import type { JobCard, PaymentStatus } from '../../types';
import { X, CheckCircle2, DollarSign, Receipt, AlertCircle } from 'lucide-react';

interface QuickPaymentModalProps {
  isOpen: boolean;
  jobCard: JobCard | undefined;
  onClose: () => void;
  onSavePayment: (jobId: string, advancePaid: number, paymentStatus: PaymentStatus, billNo?: string) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  jobCard,
  onClose,
  onSavePayment,
}) => {
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [billNo, setBillNo] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');

  useEffect(() => {
    if (jobCard) {
      setAdvancePaid(jobCard.billing.advancePaid || 0);
      setBillNo(jobCard.billing.billNo || '');
      setPaymentStatus(jobCard.billing.paymentStatus || 'Pending');
    }
  }, [jobCard]);

  if (!isOpen || !jobCard) return null;

  const sellingPrice = jobCard.billing.sellingPrice || 0;
  const computedBalance = Math.max(0, sellingPrice - (advancePaid || 0));

  const handleAmountChange = (val: number) => {
    const validAmount = Math.max(0, Math.min(sellingPrice, val));
    setAdvancePaid(validAmount);

    if (validAmount >= sellingPrice && sellingPrice > 0) {
      setPaymentStatus('Paid');
    } else if (validAmount > 0) {
      setPaymentStatus('Partial');
    } else {
      setPaymentStatus('Pending');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePayment(jobCard.id, advancePaid, paymentStatus, billNo.trim() || undefined);
    onClose();
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Record Payment</h3>
              <p className="text-[11px] text-sky-200">Job #{jobCard.jobNo} • {jobCard.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Value</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">₹ {sellingPrice.toLocaleString()}</p>
            </div>
            <div className="border-x border-slate-200 px-2">
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Current Paid</span>
              <p className="text-base font-extrabold text-emerald-700 mt-0.5">₹ {(jobCard.billing.advancePaid || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Pending Due</span>
              <p className="text-base font-extrabold text-amber-600 mt-0.5">₹ {(jobCard.billing.balanceAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Quick Payment Fill</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAmountChange(sellingPrice)}
                className="py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Full Paid (₹{sellingPrice})</span>
              </button>
              <button
                type="button"
                onClick={() => handleAmountChange(Math.round(sellingPrice / 2))}
                className="py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-center transition-all"
              >
                50% Advance (₹{Math.round(sellingPrice / 2)})
              </button>
              <button
                type="button"
                onClick={() => handleAmountChange(0)}
                className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-center transition-all"
              >
                Clear (₹0)
              </button>
            </div>
          </div>

          {/* Amount Paid Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Total Cumulative Received Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                max={sellingPrice}
                value={advancePaid === 0 ? '' : advancePaid}
                placeholder="0"
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleAmountChange(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-navy-600 focus:ring-1 focus:ring-navy-600"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Remaining balance after this payment: <strong className="text-navy-900 font-extrabold">₹ {computedBalance.toLocaleString()}</strong>
            </p>
          </div>

          {/* Bill / Invoice Number */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-navy-600" />
              <span>Bill / Invoice Number (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. INV-2026-0881"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-navy-600 focus:ring-1 focus:ring-navy-600 font-mono"
            />
          </div>

          {/* Payment Status Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Status Tag</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Pending', 'Partial', 'Paid'] as PaymentStatus[]).map((status) => {
                const isSelected = paymentStatus === status;
                let activeStyle = '';
                if (status === 'Paid') activeStyle = 'bg-emerald-600 text-white border-emerald-600';
                else if (status === 'Partial') activeStyle = 'bg-amber-500 text-white border-amber-500';
                else activeStyle = 'bg-slate-700 text-white border-slate-700';

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPaymentStatus(status)}
                    className={`py-2 rounded-xl font-bold border transition-all text-center ${
                      isSelected ? activeStyle : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notice if Overpaying or Custom */}
          {computedBalance === 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>This job order will be marked as <strong>Fully Paid</strong>. Outstanding balance will be zero.</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-sky-300" />
              <span>Save Payment Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
