import React from 'react';
import type { AnalyticsData } from '../PrintPulseAnalytics';
import { BarChart, SectionCard, DataTable, HBar, EmptyState, CHART_COLORS, shortNum } from '../ChartComponents';

interface Props {
  data: AnalyticsData;
  fmt: (n: number | null | undefined) => string;
  fmtPct: (n: number | null | undefined) => string;
}

export const CostTab: React.FC<Props> = ({ data, fmt, fmtPct }) => {
  const { costMargin } = data;

  // Margin bar chart
  const marginBar = costMargin.map((r, i) => ({
    label: String(r.job_type ?? ''),
    value: Number(r.gross_margin_pct ?? 0),
    color: Number(r.gross_margin_pct ?? 0) >= 35 ? '#34d399' : '#fb923c',
  }));

  // Gross profit bar
  const profitBar = costMargin.map((r, i) => ({
    label: String(r.job_type ?? ''),
    value: Number(r.total_gross_profit ?? 0),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const maxMargin = Math.max(...costMargin.map(r => Number(r.gross_margin_pct ?? 0)), 1);
  const maxProfit = Math.max(...costMargin.map(r => Number(r.total_gross_profit ?? 0)), 1);

  const totalProfit = costMargin.reduce((s, r) => s + Number(r.total_gross_profit ?? 0), 0);
  const avgMargin   = costMargin.length > 0
    ? costMargin.reduce((s, r) => s + Number(r.avg_margin_pct ?? 0), 0) / costMargin.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">{fmt(totalProfit)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total Gross Profit</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Selling price − estimated cost</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-violet-300">{fmtPct(avgMargin)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Avg Gross Margin</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Across all active job types</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-sky-300">{costMargin.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Job Categories Analysed</p>
        </div>
      </div>

      {/* Important note about cost model */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
        <span className="text-amber-400 text-lg shrink-0">ℹ</span>
        <div>
          <p className="text-xs font-semibold text-amber-300">About the Cost Model</p>
          <p className="text-[11px] text-amber-400/70 mt-1">
            <strong>Estimated cost</strong> = synthetic production cost from the data generator.
            <strong> Selling price</strong> = estimated cost + 25–60% synthetic margin.
            <strong> Gross profit</strong> = selling price − estimated cost.
            Actual material waste costs are not included in this calculation. All figures are synthetic.
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Gross Margin % by Job Type" sub="Higher is better — % of revenue retained after estimated cost">
          <div className="space-y-3 mt-2">
            {costMargin.length > 0 ? costMargin.slice(0, 12).map((r, i) => (
              <HBar
                key={i}
                label={String(r.job_type ?? '')}
                value={Number(r.gross_margin_pct ?? 0)}
                max={100}
                suffix="%"
                color={Number(r.gross_margin_pct ?? 0) >= 35 ? '#34d399' : '#fb923c'}
              />
            )) : <EmptyState />}
          </div>
        </SectionCard>

        <SectionCard title="Total Gross Profit by Job Type" sub="Cumulative profit generated per category">
          <div className="space-y-3 mt-2">
            {costMargin.length > 0 ? costMargin.slice(0, 12).map((r, i) => (
              <HBar
                key={i}
                label={String(r.job_type ?? '')}
                value={Number(r.total_gross_profit ?? 0)}
                max={maxProfit}
                color={CHART_COLORS[i % CHART_COLORS.length]}
              />
            )) : <EmptyState />}
          </div>
        </SectionCard>
      </div>

      {/* Detailed cost table */}
      <SectionCard title="Estimated vs Selling Price Breakdown">
        {costMargin.length > 0 ? (
          <DataTable
            columns={[
              { key: 'job_type',            label: 'Job Type' },
              { key: 'order_count',         label: 'Orders', align: 'right' },
              { key: 'avg_estimated_cost',  label: 'Avg Est. Cost', align: 'right' },
              { key: 'avg_selling_price',   label: 'Avg Sell Price', align: 'right' },
              { key: 'total_gross_profit',  label: 'Total Profit', align: 'right' },
              { key: 'gross_margin_pct',    label: 'Margin %', align: 'right' },
            ]}
            rows={costMargin as unknown as Record<string, unknown>[]}
            formatCell={(key, val) => {
              if (['avg_estimated_cost', 'avg_selling_price', 'total_gross_profit'].includes(key))
                return fmt(Number(val));
              if (key === 'gross_margin_pct') {
                const n = Number(val ?? 0);
                return <span className={n >= 35 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{n.toFixed(1)}%</span>;
              }
              return String(val ?? '—');
            }}
          />
        ) : <EmptyState />}
      </SectionCard>
    </div>
  );
};
