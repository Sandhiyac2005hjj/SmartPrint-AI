import React from 'react';
import type { AnalyticsData } from '../PrintPulseAnalytics';
import {
  LineChart, BarChart, SectionCard, DataTable, EmptyState, CHART_COLORS, shortNum,
} from '../ChartComponents';

interface Props {
  data: AnalyticsData;
  fmt: (n: number | null | undefined) => string;
  granularity: 'daily' | 'weekly' | 'monthly';
}

export const RevenueTab: React.FC<Props> = ({ data, fmt, granularity }) => {
  const { revenue, revenueByType } = data;

  // Revenue trend line data
  const revTrend = [...revenue]
    .reverse()
    .slice(-24)
    .map(r => ({
      label: String(r.date_bucket ?? '').slice(0, 10),
      value: Number(r.total_revenue ?? 0),
    }));

  // Revenue by type bar
  const byTypeBar = revenueByType.slice(0, 12).map((r, i) => ({
    label: String(r.job_type ?? ''),
    value: Number(r.total_revenue ?? 0),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Collected vs outstanding
  const collectedBar = revenue.slice(0, 12).map((r, i) => ({
    label: String(r.date_bucket ?? '').slice(0, 10),
    value: Number(r.total_collected ?? 0),
    color: '#34d399',
  }));

  // Total stats
  const totalRev     = revenue.reduce((s, r) => s + Number(r.total_revenue ?? 0), 0);
  const totalCollect = revenue.reduce((s, r) => s + Number(r.total_collected ?? 0), 0);
  const totalOut     = revenue.reduce((s, r) => s + Number(r.total_outstanding ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(totalRev), color: 'text-violet-300' },
          { label: 'Collected',     value: fmt(totalCollect), color: 'text-emerald-300' },
          { label: 'Outstanding',   value: fmt(totalOut),  color: 'text-amber-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <SectionCard
        title={`Revenue Trend (${granularity})`}
        sub="Total revenue by time period — synthetic data only"
      >
        {revTrend.length > 1
          ? <LineChart data={revTrend} height={200} color="#818cf8" formatValue={shortNum} />
          : <EmptyState msg="No revenue data. Run the ETL pipeline to load synthetic jobs." />}
      </SectionCard>

      {/* Revenue by type */}
      <SectionCard
        title="Revenue by Print Category"
        sub="Which job types generate the most revenue"
      >
        {byTypeBar.length > 0
          ? <BarChart data={byTypeBar} height={180} formatValue={shortNum} />
          : <EmptyState />}
      </SectionCard>

      {/* Table: Revenue breakdown */}
      <SectionCard
        title="Revenue Breakdown by Job Type"
        sub="Order count, total revenue, average value, and delivery rate"
      >
        <DataTable
          columns={[
            { key: 'job_type',          label: 'Job Type' },
            { key: 'order_count',       label: 'Orders', align: 'right' },
            { key: 'total_revenue',     label: 'Total Revenue', align: 'right' },
            { key: 'avg_revenue',       label: 'Avg Order Value', align: 'right' },
            { key: 'delivered_count',   label: 'Delivered', align: 'right' },
            { key: 'delivery_rate_pct', label: 'Delivery Rate', align: 'right' },
          ]}
          rows={revenueByType as unknown as Record<string, unknown>[]}
          maxRows={15}
          formatCell={(key, val) => {
            if (key === 'total_revenue' || key === 'avg_revenue') return fmt(Number(val));
            if (key === 'delivery_rate_pct') return `${Number(val ?? 0).toFixed(1)}%`;
            return String(val ?? '—');
          }}
        />
      </SectionCard>
    </div>
  );
};
