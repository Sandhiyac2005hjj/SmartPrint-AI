import React, { useState } from 'react';
import type { CompanySettings, Employee } from '../../types';
import { Building, User, Phone, Mail, FileText, Save, Check, Users, Plus, Trash2, ShieldCheck } from 'lucide-react';

interface SettingsProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  employees: Employee[];
  onAddEmployee: (employeeData: { name: string; role: string; phone?: string }) => void;
  onDeleteEmployee: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  employees,
  onAddEmployee,
  onDeleteEmployee,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Employee state
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Offset Operator');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [empError, setEmpError] = useState('');

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) {
      setEmpError('Please enter operator name');
      return;
    }
    onAddEmployee({
      name: newEmpName.trim(),
      role: newEmpRole.trim(),
      phone: newEmpPhone.trim() || undefined,
    });
    setNewEmpName('');
    setNewEmpPhone('');
    setEmpError('');
  };

  const roleOptions = [
    'Offset Operator',
    'Digital Printer',
    'Design Lead',
    'Finishing Tech',
    'Quality Inspector',
    'Bindery Specialist',
    'Pre-Press Specialist',
    'Press Helper',
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-navy-950 tracking-tight">Printing Press Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure company branding, owner credentials, staff roster & Job Card rules.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Press branding and owner details successfully saved! All printed Job Cards will update automatically.</span>
        </div>
      )}

      {/* Staff Roster Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Users className="w-4 h-4 text-navy-700" /> Press Operators & Staff Roster
          </h3>
          <span className="text-[11px] font-bold bg-navy-50 text-navy-800 px-2.5 py-1 rounded-full border border-navy-100">
            {employees.length} Active Team Members
          </span>
        </div>

        <p className="text-slate-500 text-[11px]">
          These operators appear in the <strong>Assigned Press Operator</strong> dropdown when generating or updating Job Cards.
        </p>

        {/* Add Employee Form */}
        <form onSubmit={handleAddEmployeeSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-navy-700" /> Add New Staff / Press Operator
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Full Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-navy-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Designation / Role</label>
              <select
                value={newEmpRole}
                onChange={(e) => setNewEmpRole(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none font-medium"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Phone Number (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={newEmpPhone}
                  onChange={(e) => setNewEmpPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-navy-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" /> Add
                </button>
              </div>
            </div>
          </div>
          {empError && <p className="text-[11px] text-rose-500 font-semibold">{empError}</p>}
        </form>

        {/* Existing Employees List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{emp.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-navy-700 bg-navy-50 px-2 py-0.5 rounded-md border border-navy-100">
                    {emp.role}
                  </span>
                </div>
                {emp.phone && (
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {emp.phone}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDeleteEmployee(emp.id)}
                title="Remove staff member"
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
        {/* Company Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-navy-700" /> Printing Company Branding & Ownership
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Press Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-navy-600 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owner Name</label>
              <input
                type="text"
                value={formData.ownerName || 'G. Chandru'}
                onChange={(e) => handleChange('ownerName', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-navy-600 font-bold text-navy-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase font-mono font-bold text-navy-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Press Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>
        </div>

        {/* System Prefix Settings */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-navy-700" /> Numbering & Currency Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Card ID Prefix</label>
              <input
                type="text"
                value={formData.jobPrefix}
                onChange={(e) => handleChange('jobPrefix', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Example: JC-2026- will generate JC-2026-0001</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Terms & Conditions Footer for Printed Job Ticket */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-2">
            Job Ticket Print Terms & Conditions
          </h3>

          <textarea
            rows={4}
            value={formData.terms}
            onChange={(e) => handleChange('terms', e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-xs"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4 text-sky-300" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

