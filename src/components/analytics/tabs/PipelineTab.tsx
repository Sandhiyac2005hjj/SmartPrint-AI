import React from 'react';
import type { AnalyticsData } from '../PrintPulseAnalytics';
import {
  SectionCard, DataTable, EmptyState, StatBadge, CHART_COLORS,
} from '../ChartComponents';
import { CheckCircle2, XCircle, Clock, Database, AlertCircle } from 'lucide-react';

interface Props {
  data: AnalyticsData;
  fmt: (n: number | null | undefined) => string;
  fmtPct: (n: number | null | undefined) => string;
}

export const PipelineTab: React.FC<Props> = ({ data, fmt, fmtPct }) => {
  const { pipelineRuns, dataQuality, quarantineRules } = data;

  const latestRun = pipelineRuns[0] ?? null;

  const totalRejected = quarantineRules.reduce((s, r) => s + Number(r.rejection_count ?? 0), 0);
  const maxReject = Math.max(...quarantineRules.map(r => Number(r.rejection_count ?? 0)), 1);

  return (
    <div className="space-y-6">
      {/* Latest run hero */}
      {latestRun ? (
        <div className={`rounded-2xl border p-5 ${
          latestRun.status === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-red-500/30 bg-red-500/5'
        }`}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {latestRun.status === 'success'
                ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                : <XCircle className="w-6 h-6 text-red-400" />}
              <div>
                <p className="text-sm font-bold text-white">Latest Pipeline Run</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{String(latestRun.run_id).slice(0, 24)}…</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              latestRun.status === 'success'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>{latestRun.status}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {[
              { label: 'Total Records', value: Number(latestRun.total_records).toLocaleString() },
              { label: 'Accepted',      value: Number(latestRun.accepted_records).toLocaleString() },
              { label: 'Rejected',      value: Number(latestRun.rejected_records).toLocaleString() },
              { label: 'Accept Rate',   value: `${Number(latestRun.acceptance_rate_pct ?? 0).toFixed(1)}%` },
              { label: 'Duration',      value: `${Number(latestRun.duration_secs ?? 0).toFixed(1)}s` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-black text-white">{value}</p>
                <p className="text-[10px] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-3">
            Started: {String(latestRun.started_at ?? '').replace('T', ' ').slice(0, 19)} ·
            Source: {latestRun.source_file}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <Database className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No pipeline runs recorded yet</p>
          <p className="text-[11px] text-slate-600 mt-2">
            Run: <code className="text-sky-400">cd analytics/pipeline && python run_pipeline.py</code>
          </p>
        </div>
      )}

      {/* Data quality summary */}
      {dataQuality && (
        <SectionCard title="Overall Data Quality" sub="Aggregated across all pipeline runs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBadge label="Total Processed"    value={Number(dataQuality.total_records_processed ?? 0).toLocaleString()} color="text-sky-400" />
            <StatBadge label="Accepted"           value={Number(dataQuality.total_accepted ?? 0).toLocaleString()} color="text-emerald-400" />
            <StatBadge label="Rejected"           value={Number(dataQuality.total_rejected ?? 0).toLocaleString()} color="text-red-400" />
            <StatBadge label="Acceptance Rate"    value={fmtPct(dataQuality.overall_acceptance_rate_pct)} color="text-violet-400" />
            <StatBadge label="Error Rate"         value={fmtPct(dataQuality.overall_error_rate_pct)} color="text-amber-400" />
            <StatBadge label="Total Runs"         value={String(dataQuality.total_pipeline_runs ?? 0)} color="text-pink-400" />
            <StatBadge label="Successful Runs"    value={String(dataQuality.successful_runs ?? 0)} color="text-emerald-400" />
            <StatBadge label="Pipeline Success %" value={fmtPct(dataQuality.pipeline_success_rate_pct)} color="text-sky-300" />
          </div>
        </SectionCard>
      )}

      {/* Quarantine breakdown */}
      {quarantineRules.length > 0 && (
        <SectionCard
          title="Rejected Records by Validation Rule"
          sub="Breakdown of why records were quarantined"
          className="border-amber-500/20 bg-amber-500/[0.03]"
        >
          <div className="space-y-3 mt-2">
            {quarantineRules.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-amber-300 truncate max-w-[280px]">
                  {r.rejection_rule ?? 'unknown'}
                </span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-amber-500/60"
                    style={{ width: `${Math.min(100, (Number(r.rejection_count) / maxReject) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-white w-12 text-right shrink-0">
                  {Number(r.rejection_count).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Pipeline run history */}
      <SectionCard title="Pipeline Execution History" sub="Last 20 pipeline runs">
        {pipelineRuns.length > 0 ? (
          <DataTable
            columns={[
              { key: 'started_at',          label: 'Started' },
              { key: 'status',              label: 'Status' },
              { key: 'total_records',       label: 'Total', align: 'right' },
              { key: 'accepted_records',    label: 'Accepted', align: 'right' },
              { key: 'rejected_records',    label: 'Rejected', align: 'right' },
              { key: 'acceptance_rate_pct', label: 'Accept %', align: 'right' },
              { key: 'duration_secs',       label: 'Duration', align: 'right' },
            ]}
            rows={pipelineRuns as unknown as Record<string, unknown>[]}
            maxRows={20}
            formatCell={(key, val) => {
              if (key === 'status') {
                return (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    val === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>{String(val)}</span>
                );
              }
              if (key === 'started_at') return String(val ?? '').replace('T', ' ').slice(0, 19);
              if (key === 'acceptance_rate_pct') return `${Number(val ?? 0).toFixed(1)}%`;
              if (key === 'duration_secs') return `${Number(val ?? 0).toFixed(1)}s`;
              return String(val ?? '—');
            }}
          />
        ) : (
          <EmptyState msg="No pipeline runs yet. Run: python analytics/pipeline/run_pipeline.py" />
        )}
      </SectionCard>
    </div>
  );
};
