import React from 'react';
import type { AnalyticsData } from '../PrintPulseAnalytics';
import { SectionCard, DataTable, HBar, EmptyState, CHART_COLORS } from '../ChartComponents';

interface Props {
  data: AnalyticsData;
  fmt: (n: number | null | undefined) => string;
}

export const CustomersTab: React.FC<Props> = ({ data, fmt }) => {
  const { repeatCustomers } = data;

  const maxOrders = Math.max(...repeatCustomers.map(c => Number(c.total_orders ?? 0)), 1);
  const maxValue  = Math.max(...repeatCustomers.map(c => Number(c.lifetime_value ?? 0)), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-violet-300">{repeatCustomers.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Repeat Customers</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {fmt(repeatCustomers.reduce((s, c) => s + Number(c.lifetime_value ?? 0), 0))}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total LTV (Repeat Customers)</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-sky-300">
            {repeatCustomers.length > 0
              ? fmt(repeatCustomers.reduce((s, c) => s + Number(c.avg_order_value ?? 0), 0) / repeatCustomers.length)
              : '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Avg Order Value (Repeat)</p>
        </div>
      </div>

      {/* Top by orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Top Customers by Order Count" sub="Customers with most orders">
          <div className="space-y-3 mt-2">
            {repeatCustomers.length > 0
              ? repeatCustomers.slice(0, 10).map((c, i) => (
                  <HBar
                    key={i}
                    label={c.customer_name ?? String(i)}
                    value={Number(c.total_orders ?? 0)}
                    max={maxOrders}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))
              : <EmptyState />}
          </div>
        </SectionCard>

        <SectionCard title="Top Customers by Revenue" sub="Customers with highest lifetime value">
          <div className="space-y-3 mt-2">
            {repeatCustomers.length > 0
              ? repeatCustomers
                  .slice()
                  .sort((a, b) => Number(b.lifetime_value ?? 0) - Number(a.lifetime_value ?? 0))
                  .slice(0, 10)
                  .map((c, i) => (
                    <HBar
                      key={i}
                      label={c.customer_name ?? String(i)}
                      value={Number(c.lifetime_value ?? 0)}
                      max={maxValue}
                      color={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))
              : <EmptyState />}
          </div>
        </SectionCard>
      </div>

      {/* Full table */}
      <SectionCard title="Repeat Customer Directory" sub="All customers with 2+ orders, sorted by total orders">
        {repeatCustomers.length > 0 ? (
          <DataTable
            columns={[
              { key: 'customer_name',   label: 'Customer Name' },
              { key: 'company',         label: 'Company' },
              { key: 'total_orders',    label: 'Orders', align: 'right' },
              { key: 'lifetime_value',  label: 'Lifetime Value', align: 'right' },
              { key: 'avg_order_value', label: 'Avg Order', align: 'right' },
              { key: 'first_order_date',label: 'First Order' },
              { key: 'last_order_date', label: 'Last Order' },
            ]}
            rows={repeatCustomers as unknown as Record<string, unknown>[]}
            maxRows={30}
            formatCell={(key, val) => {
              if (key === 'lifetime_value' || key === 'avg_order_value') return fmt(Number(val));
              if (key === 'first_order_date' || key === 'last_order_date')
                return String(val ?? '').slice(0, 10);
              return String(val ?? '—');
            }}
          />
        ) : (
          <EmptyState msg="No repeat customers found. Run the ETL pipeline to load synthetic customer data." />
        )}
      </SectionCard>
    </div>
  );
};
