import React from 'react';
import type { AnalyticsData } from '../PrintPulseAnalytics';
import type { OnTimeByTypeRow } from '../../../services/analytics.service';
import {
  BarChart, DonutChart, SectionCard, DataTable, EmptyState,
  HBar, CHART_COLORS, StatBadge,
} from '../ChartComponents';

interface Props {
  data: AnalyticsData;
  fmt: (n: number | null | undefined) => string;
  fmtPct: (n: number | null | undefined) => string;
}

export const ProductionTab: React.FC<Props> = ({ data, fmt, fmtPct }) => {
  const { statusSummary, onTime, onTimeByType, overdueJobs } = data;

  const statusDonut = statusSummary.map((s, i) => ({
    label: s.status,
    value: Number(s.job_count),
    color: CHART_COLORS[i],
  }));

  const onTimeBar = onTimeByType.slice(0, 12).map((r, i) => ({
    label: String(r.job_type ?? ''),
    value: Number(r.on_time_rate_pct ?? 0),
    color: Number(r.on_time_rate_pct ?? 0) >= 80 ? '#34d399' : '#fb923c',
  }));

  const maxOnTime = Math.max(...onTimeByType.map(r => Number(r.on_time_rate_pct ?? 0)), 1);

  return (
    <div className="space-y-6">
      {/* Key production metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge label="On-Time Rate" value={fmtPct(onTime?.on_time_rate_pct)} color="text-emerald-400" />
        <StatBadge label="Total Delivered" value={Number(onTime?.total_delivered ?? 0).toLocaleString()} color="text-sky-400" />
        <StatBadge label="Late Deliveries" value={Number(onTime?.late_count ?? 0).toLocaleString()} color="text-red-400" />
        <StatBadge label="Overdue Now" value={overdueJobs.length.toString()} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatBadge label="Avg Promised Lead Days" value={`${Number(onTime?.avg_promised_lead_days ?? 0).toFixed(1)} days`} color="text-violet-400" />
        <StatBadge label="Avg Actual Lead Days"   value={`${Number(onTime?.avg_actual_lead_days  ?? 0).toFixed(1)} days`} color="text-pink-400" />
      </div>

      {/* Status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Job Status Distribution">
          {statusDonut.length > 0
            ? <DonutChart data={statusDonut} size={160}
                centerLabel="Total"
                centerValue={statusSummary.reduce((s, r) => s + Number(r.job_count), 0).toLocaleString()} />
            : <EmptyState />}
        </SectionCard>

        <SectionCard title="On-Time Delivery by Job Type" sub="Percentage of on-time deliveries per category">
          <div className="space-y-3 mt-2">
            {onTimeByType.length > 0 ? onTimeByType.slice(0, 12).map((r, i) => (
              <HBar
                key={i}
                label={String(r.job_type ?? '')}
                value={Number(r.on_time_rate_pct ?? 0)}
                max={100}
                suffix="%"
                color={Number(r.on_time_rate_pct ?? 0) >= 80 ? '#34d399' : '#fb923c'}
              />
            )) : <EmptyState />}
          </div>
        </SectionCard>
      </div>

      {/* Status value table */}
      <SectionCard title="Production Status Breakdown" sub="Orders and revenue by current status">
        <DataTable
          columns={[
            { key: 'status',       label: 'Status' },
            { key: 'job_count',    label: 'Orders', align: 'right' },
            { key: 'pct_of_total', label: '% of Total', align: 'right' },
            { key: 'total_value',  label: 'Total Value', align: 'right' },
            { key: 'avg_value',    label: 'Avg Value', align: 'right' },
          ]}
          rows={statusSummary as unknown as Record<string, unknown>[]}
          formatCell={(key, val) => {
            if (key === 'total_value' || key === 'avg_value') return fmt(Number(val));
            if (key === 'pct_of_total') return `${Number(val ?? 0).toFixed(1)}%`;
            if (key === 'status') {
              const colors: Record<string, string> = {
                Delivered: 'text-emerald-400', Cancelled: 'text-red-400',
                Pending: 'text-amber-400', Ready: 'text-sky-400',
              };
              return <span className={`font-bold ${colors[String(val)] ?? 'text-white'}`}>{String(val)}</span>;
            }
            return String(val ?? '—');
          }}
        />
      </SectionCard>

      {/* On-time by type table */}
      {onTimeByType.length > 0 && (
        <SectionCard title="On-Time Delivery Table" sub="Delivered count and rate by job category">
          <DataTable
            columns={[
              { key: 'job_type',          label: 'Job Type' },
              { key: 'delivered_count',   label: 'Delivered', align: 'right' },
              { key: 'on_time_count',     label: 'On Time', align: 'right' },
              { key: 'on_time_rate_pct',  label: 'On-Time %', align: 'right' },
            ]}
            rows={onTimeByType as unknown as Record<string, unknown>[]}
            formatCell={(key, val) => {
              if (key === 'on_time_rate_pct') {
                const n = Number(val ?? 0);
                return <span className={n >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{n.toFixed(1)}%</span>;
              }
              return String(val ?? '—');
            }}
          />
        </SectionCard>
      )}
    </div>
  );
};
