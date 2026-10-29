import React, { useState } from 'react';
import { JobCard, JobStatus } from '../../types';
import { 
  Clock, 
  Paintbrush, 
  Printer, 
  Scissors, 
  PackageCheck, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Check
} from 'lucide-react';

interface JobCardTimelineProps {
  jobCard: JobCard;
  onUpdateStatus: (id: string, status: JobStatus, note?: string) => void;
}

export const JobCardTimeline: React.FC<JobCardTimelineProps> = ({
  jobCard,
  onUpdateStatus,
}) => {
  const [selectedNextStatus, setSelectedNextStatus] = useState<JobStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [showStatusInput, setShowStatusInput] = useState(false);

  const stages: { status: JobStatus; label: string; icon: any }[] = [
    { status: 'Pending', label: 'Job Registered', icon: Clock },
    { status: 'Designing', label: 'Pre-Press / Design', icon: Paintbrush },
    { status: 'Printing', label: 'On Machine Printing', icon: Printer },
    { status: 'Finishing', label: 'Post-Press Finishing', icon: Scissors },
    { status: 'Ready', label: 'Ready for Delivery', icon: PackageCheck },
    { status: 'Delivered', label: 'Customer Delivered', icon: CheckCircle2 },
  ];

  const currentStageIndex = stages.findIndex((s) => s.status === jobCard.status);

  const handleAdvanceStatus = (nextStatus: JobStatus) => {
    onUpdateStatus(jobCard.id, nextStatus, statusNote.trim() || undefined);
    setStatusNote('');
    setShowStatusInput(false);
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Production Timeline & Progress Flow</h4>
          <p className="text-[11px] text-slate-500">Live timestamp audit log across shop floor operations</p>
        </div>

        {/* Quick Transition Trigger */}
        {jobCard.status !== 'Delivered' && jobCard.status !== 'Cancelled' && (
          <button
            onClick={() => setShowStatusInput(!showStatusInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 hover:bg-navy-950 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-300" />
            <span>Update Stage</span>
          </button>
        )}
      </div>

      {/* Interactive Status Update Panel */}
      {showStatusInput && (
        <div className="p-4 bg-white rounded-xl border border-navy-200 shadow-sm space-y-3 animate-fadeIn">
          <p className="font-bold text-xs text-navy-900">Advance Job Stage:</p>
          <div className="flex flex-wrap gap-2">
            {stages.map((stage) => (
              <button
                key={stage.status}
                onClick={() => setSelectedNextStatus(stage.status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedNextStatus === stage.status
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Operator Note (Optional)</label>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Loaded paper on Offset Machine 1; proof approved."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowStatusInput(false)}
              className="px-3 py-1 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={!selectedNextStatus}
              onClick={() => selectedNextStatus && handleAdvanceStatus(selectedNextStatus)}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all"
            >
              Confirm Update
            </button>
          </div>
        </div>
      )}

      {/* Visual Timeline Nodes */}
      <div className="relative flex items-center justify-between px-2 pt-2">
        {/* Connecting Line */}
        <div className="absolute left-8 right-8 top-7 h-1 bg-slate-200 -z-0" />
        <div
          className="absolute left-8 top-7 h-1 bg-emerald-500 transition-all duration-500 -z-0"
          style={{
            width: `${Math.max(0, (currentStageIndex / (stages.length - 1)) * 90)}%`,
          }}
        />

        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCompleted = idx <= currentStageIndex && jobCard.status !== 'Cancelled';
          const isCurrent = idx === currentStageIndex && jobCard.status !== 'Cancelled';

          return (
            <div key={stage.status} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCurrent
                    ? 'bg-navy-900 border-sky-400 text-white shadow-lg ring-4 ring-sky-100 scale-110'
                    : isCompleted
                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted && !isCurrent ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[11px] mt-2 font-bold ${isCurrent ? 'text-navy-950' : 'text-slate-500'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Timeline Events History List */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Timestamp Log History</h5>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {jobCard.timeline.map((event) => (
            <div key={event.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy-900">{event.status}</span>
                  <span className="text-[10px] text-slate-400">by {event.updatedBy}</span>
                </div>
                {event.note && <p className="text-slate-600 text-[11px] mt-0.5">{event.note}</p>}
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {new Date(event.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
