import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { X, ArrowLeft, User, Building, Phone, Mail, FileText, MapPin, Save } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  customer?: Customer;
  onClose: () => void;
  onSave: (data: Omit<Customer, 'id' | 'customerCode' | 'createdAt'> & { id?: string }) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setCompany(customer.company || '');
      setPhone(customer.phone || '');
      setAltPhone(customer.altPhone || '');
      setEmail(customer.email || '');
      setGstNumber(customer.gstNumber || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    } else {
      setName('');
      setCompany('');
      setPhone('');
      setAltPhone('');
      setEmail('');
      setGstNumber('');
      setAddress('');
      setNotes('');
    }
    setErrors({});
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Customer name is required';
    if (!company.trim()) newErrors.company = 'Company name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!address.trim()) newErrors.address = 'Address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: customer?.id,
      name: name.trim(),
      company: company.trim(),
      phone: phone.trim(),
      altPhone: altPhone.trim() || undefined,
      email: email.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
      address: address.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all mr-1"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-sky-300" />
              <span>Back</span>
            </button>
            <User className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">{customer ? 'Edit Customer Profile' : 'Add New Customer'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-navy-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                    errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                  } rounded-lg text-xs outline-none focus:ring-2`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Sharma Enterprises"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                    errors.company ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                  } rounded-lg text-xs outline-none focus:ring-2`}
                />
              </div>
              {errors.company && <p className="text-[11px] text-rose-500 mt-1">{errors.company}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98401 12345"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                    errors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                  } rounded-lg text-xs outline-none focus:ring-2`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Alternate Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="e.g. +91 98401 54321"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 rounded-lg text-xs outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 rounded-lg text-xs outline-none"
                />
              </div>
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GST Number</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 rounded-lg text-xs font-mono outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Billing & Delivery Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete street, area, city, pincode..."
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 border ${
                  errors.address ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                } rounded-lg text-xs outline-none focus:ring-2`}
              />
            </div>
            {errors.address && <p className="text-[11px] text-rose-500 mt-1">{errors.address}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Preferences & Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Special paper preferences, usual delivery requirements..."
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 rounded-lg text-xs outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-950 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-4 h-4 text-sky-300" />
              <span>{customer ? 'Update Customer' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
