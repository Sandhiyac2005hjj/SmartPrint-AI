import React from 'react';
import type { AnalyticsData } from '../PrintPulseAnalytics';
import {
  KpiCard, BarChart, DonutChart, SectionCard, DataTable, EmptyState, CHART_COLORS,
} from '../ChartComponents';
import {
  TrendingUp, Users, Clock, CheckCircle2, XCircle, AlertCircle, Package,
} from 'lucide-react';

interface Props {
  data: AnalyticsData;
  fmt: (n: number | null | undefined, prefix?: string) => string;
  fmtPct: (n: number | null | undefined) => string;
}

export const OverviewTab: React.FC<Props> = ({ data, fmt, fmtPct }) => {
  const { kpi, statusSummary, onTime, overdueJobs } = data;

  const statusBarData = statusSummary.map((s, i) => ({
    label: s.status,
    value: Number(s.job_count),
    color: CHART_COLORS[i],
  }));

  const statusDonutData = statusSummary.map((s, i) => ({
    label: s.status,
    value: Number(s.job_count),
    color: CHART_COLORS[i],
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={fmt(kpi?.total_revenue)}
          sub="All non-cancelled orders"
          icon={<TrendingUp className="w-4 h-4" />}
          color="from-violet-600/20 to-violet-600/5"
          trend="up"
        />
        <KpiCard
          label="Total Orders"
          value={kpi?.total_orders?.toLocaleString() ?? '—'}
          sub={`${kpi?.active_count ?? 0} active`}
          icon={<Package className="w-4 h-4" />}
          color="from-sky-600/20 to-sky-600/5"
        />
        <KpiCard
          label="On-Time Delivery"
          value={fmtPct(onTime?.on_time_rate_pct)}
          sub={`${onTime?.on_time_count ?? 0} of ${onTime?.total_delivered ?? 0} delivered`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="from-emerald-600/20 to-emerald-600/5"
          trend={Number(onTime?.on_time_rate_pct) >= 80 ? 'up' : 'down'}
        />
        <KpiCard
          label="Gross Margin"
          value={fmtPct(kpi?.gross_margin_pct)}
          sub="Revenue minus estimated cost"
          icon={<TrendingUp className="w-4 h-4" />}
          color="from-amber-600/20 to-amber-600/5"
        />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Avg Order Value"
          value={fmt(kpi?.avg_order_value)}
          icon={<TrendingUp className="w-4 h-4" />}
          color="from-pink-600/20 to-pink-600/5"
        />
        <KpiCard
          label="Total Customers"
          value={kpi?.total_customers?.toLocaleString() ?? '—'}
          icon={<Users className="w-4 h-4" />}
          color="from-indigo-600/20 to-indigo-600/5"
        />
        <KpiCard
          label="Overdue Jobs"
          value={overdueJobs.length.toString()}
          sub="Past due date, not delivered"
          icon={<AlertCircle className="w-4 h-4" />}
          color="from-red-600/20 to-red-600/5"
          trend={overdueJobs.length > 0 ? 'down' : 'neutral'}
        />
        <KpiCard
          label="Balance Outstanding"
          value={fmt(kpi?.total_outstanding)}
          sub="Pending collection"
          icon={<Clock className="w-4 h-4" />}
          color="from-orange-600/20 to-orange-600/5"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Job Status Distribution" sub="All orders by current status">
          {statusDonutData.length > 0
            ? <DonutChart data={statusDonutData} size={150} centerLabel="Orders"
                centerValue={statusSummary.reduce((s, r) => s + Number(r.job_count), 0).toLocaleString()} />
            : <EmptyState />}
        </SectionCard>

        <SectionCard title="Order Volume by Status" sub="Job count per status">
          <BarChart data={statusBarData} height={160} formatValue={v => String(v)} />
        </SectionCard>
      </div>

      {/* Overdue jobs table */}
      {overdueJobs.length > 0 && (
        <SectionCard
          title={`⚠ Overdue Jobs (${overdueJobs.length})`}
          sub="Jobs past promised delivery date — not yet delivered"
          className="border-red-500/20 bg-red-500/5"
        >
          <DataTable
            columns={[
              { key: 'job_no',        label: 'Job #' },
              { key: 'customer_name', label: 'Customer' },
              { key: 'job_type',      label: 'Type' },
              { key: 'priority',      label: 'Priority' },
              { key: 'promised_date', label: 'Due Date' },
              { key: 'days_overdue',  label: 'Days Late', align: 'right' },
              { key: 'payment_status',label: 'Payment' },
            ]}
            rows={overdueJobs as unknown as Record<string, unknown>[]}
            maxRows={10}
            formatCell={(key, val) => {
              if (key === 'days_overdue') return (
                <span className="font-bold text-red-400">{String(val)} days</span>
              );
              if (key === 'priority') return (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  val === 'Urgent' ? 'bg-red-500/20 text-red-400' :
                  val === 'High'   ? 'bg-orange-500/20 text-orange-400' : 'text-slate-300'
                }`}>{String(val)}</span>
              );
              return String(val ?? '—');
            }}
          />
        </SectionCard>
      )}
    </div>
  );
};
