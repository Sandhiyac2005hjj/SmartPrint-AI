import React from 'react';
import { JobStatus, PriorityLevel } from '../../types';
import { Clock, Paintbrush, Printer, Scissors, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 icon-amber-600';
      case 'Designing':
        return 'bg-purple-50 text-purple-700 border-purple-200 icon-purple-600';
      case 'Printing':
        return 'bg-blue-50 text-blue-700 border-blue-200 icon-blue-600';
      case 'Finishing':
        return 'bg-orange-50 text-orange-700 border-orange-200 icon-orange-600';
      case 'Ready':
        return 'bg-teal-50 text-teal-700 border-teal-200 icon-teal-600';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 icon-emerald-600';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200 icon-rose-600';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getIcon = () => {
    const iconClass = 'w-3.5 h-3.5 mr-1';
    switch (status) {
      case 'Pending': return <Clock className={iconClass} />;
      case 'Designing': return <Paintbrush className={iconClass} />;
      case 'Printing': return <Printer className={iconClass} />;
      case 'Finishing': return <Scissors className={iconClass} />;
      case 'Ready': return <PackageCheck className={iconClass} />;
      case 'Delivered': return <CheckCircle className={iconClass} />;
      case 'Cancelled': return <AlertCircle className={iconClass} />;
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  };

  return (
    <span className={`inline-flex items-center rounded-full border shadow-xs transition-all ${getBadgeStyle()} ${sizeClasses[size]}`}>
      {getIcon()}
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const styles = {
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
    Medium: 'bg-sky-50 text-sky-700 border-sky-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
    Urgent: 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider border ${styles[priority]}`}>
      {priority}
    </span>
  );
};
