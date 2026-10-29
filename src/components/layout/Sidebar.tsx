import React from 'react';
import type { ActiveTab, CompanySettings } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard,
  FolderArchive, 
  BarChart3, 
  Settings as SettingsIcon,
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: CompanySettings;
  jobCount: number;
  customerCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  jobCount,
  customerCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users, count: customerCount },
    { id: 'jobcards', label: 'Job Cards', icon: FileText, count: jobCount },
    { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
    { id: 'files', label: 'File Archive', icon: FolderArchive },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="no-print w-64 bg-navy-900 text-white flex flex-col border-r border-navy-800 shrink-0 select-none shadow-xl min-h-screen">
      {/* Press Logo / Branding */}
      <div className="p-5 border-b border-navy-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-700 to-indigo-600 flex items-center justify-center text-white shadow-md border border-navy-600">
          <Printer className="w-5 h-5 text-sky-300" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm text-white truncate tracking-tight">
            {settings.companyName || 'Sai Graphics'}
          </h1>
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-sky-300 font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>Owner: {settings.ownerName || 'G. Chandru'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-2">Main Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-navy-800 text-white shadow-sm border-l-4 border-sky-400 font-semibold'
                  : 'text-navy-200 hover:bg-navy-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-sky-400' : 'text-navy-300'}`} />
                <span>{item.label}</span>
              </div>

              {item.count !== undefined ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-sky-500 text-navy-950' : 'bg-navy-800 text-navy-300'
                }`}>
                  {item.count}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? 'opacity-100 text-sky-400' : 'opacity-0 group-hover:opacity-100 text-navy-400'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Press Info */}
      <div className="p-4 border-t border-navy-800 bg-navy-950/60 text-xs text-navy-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-navy-400">Press System</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-navy-800 text-sky-300 font-mono">v1.0 Pro</span>
        </div>
        <p className="text-[10px] text-navy-400 mt-2 truncate">GST: {settings.gstNumber || '33AAAAA0000A1Z5'}</p>
      </div>
    </aside>
  );
};
