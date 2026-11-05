/**
 * PrintPulse Analytics — Main Dashboard Component
 * ================================================
 * Professional BI dashboard consuming Spring Boot /api/analytics/* endpoints.
 * All data comes from real PostgreSQL queries — no hardcoded numbers.
 *
 * Sub-tabs:
 *   Overview | Revenue | Production | Customers | Cost & Waste | Pipeline | ML Predictor
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, Factory, DollarSign,
  Database, Brain, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Package, XCircle, Zap, Activity, ArrowUpRight,
  ChevronDown, Info
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics.service';
import type {
  KpiSummary, RevenueRow, JobTypeRow, StatusRow,
  OnTimeRow, OverdueRow, PipelineRun, DataQuality,
  CostMarginRow, QuarantineRule, RepeatCustomer, OnTimeByTypeRow,
} from '../../services/analytics.service';

// ── Sub-tab imports ──────────────────────────────────────────────────────────
import { OverviewTab }    from './tabs/OverviewTab';
import { RevenueTab }     from './tabs/RevenueTab';
import { ProductionTab }  from './tabs/ProductionTab';
import { CustomersTab }   from './tabs/CustomersTab';
import { CostTab }        from './tabs/CostTab';
import { PipelineTab }    from './tabs/PipelineTab';
import { MLPredictorTab } from './tabs/MLPredictorTab';

// ── Types ────────────────────────────────────────────────────────────────────
export interface AnalyticsData {
  kpi:             KpiSummary | null;
  revenue:         RevenueRow[];
  revenueByType:   JobTypeRow[];
  statusSummary:   StatusRow[];
  onTime:          OnTimeRow | null;
  onTimeByType:    OnTimeByTypeRow[];
  overdueJobs:     OverdueRow[];
  repeatCustomers: RepeatCustomer[];
  costMargin:      CostMarginRow[];
  pipelineRuns:    PipelineRun[];
  dataQuality:     DataQuality | null;
  quarantineRules: QuarantineRule[];
  loading:         boolean;
  error:           string | null;
  lastRefresh:     Date | null;
}

// ── Sub-tab config ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',        icon: BarChart3   },
  { id: 'revenue',     label: 'Revenue',         icon: TrendingUp  },
  { id: 'production',  label: 'Production',      icon: Factory     },
  { id: 'customers',   label: 'Customers',       icon: Users       },
  { id: 'cost',        label: 'Cost & Waste',    icon: DollarSign  },
  { id: 'pipeline',    label: 'Pipeline',        icon: Database    },
  { id: 'ml',          label: 'ML Predictor',    icon: Brain       },
] as const;

type SubTab = typeof TABS[number]['id'];

// ── Main Component ────────────────────────────────────────────────────────────
export const PrintPulseAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [data, setData] = useState<AnalyticsData>({
    kpi: null, revenue: [], revenueByType: [], statusSummary: [],
    onTime: null, onTimeByType: [], overdueJobs: [], repeatCustomers: [],
    costMargin: [], pipelineRuns: [], dataQuality: null, quarantineRules: [],
    loading: true, error: null, lastRefresh: null,
  });

  const loadAll = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [
        kpi, revenue, revenueByType, statusSummary, onTime, onTimeByType,
        overdueJobs, repeatCustomers, costMargin, pipelineRuns, dataQuality, quarantineRules,
      ] = await Promise.all([
        analyticsApi.getKpi(),
        analyticsApi.getRevenue(granularity),
        analyticsApi.getRevenueByType(),
        analyticsApi.getStatusSummary(),
        analyticsApi.getOnTimeDelivery(),
        analyticsApi.getOnTimeByType(),
        analyticsApi.getOverdueJobs(),
        analyticsApi.getRepeatCustomers(),
        analyticsApi.getCostMargin(),
        analyticsApi.getPipelineRuns(),
        analyticsApi.getDataQuality(),
        analyticsApi.getQuarantineByRule(),
      ]);

      setData({
        kpi, revenue: revenue ?? [], revenueByType: revenueByType ?? [],
        statusSummary: statusSummary ?? [], onTime, onTimeByType: onTimeByType ?? [],
        overdueJobs: overdueJobs ?? [], repeatCustomers: repeatCustomers ?? [],
        costMargin: costMargin ?? [], pipelineRuns: pipelineRuns ?? [],
        dataQuality, quarantineRules: quarantineRules ?? [],
        loading: false, error: null, lastRefresh: new Date(),
      });
    } catch (err) {
      setData(prev => ({
        ...prev, loading: false,
        error: 'Failed to load analytics. Ensure the Spring Boot backend is running on port 8080.',
      }));
    }
  }, [granularity]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const fmt = (n: number | null | undefined, prefix = '₹') =>
    n == null ? '—' : `${prefix}${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const fmtPct = (n: number | null | undefined) =>
    n == null ? '—' : `${Number(n).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-navy-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-sky-500 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">PrintPulse Analytics</h1>
                <p className="text-[11px] text-slate-400">
                  ⚠ Synthetic data only — portfolio demonstration
                  {data.lastRefresh && (
                    <span className="ml-2 text-slate-500">
                      · Refreshed {data.lastRefresh.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Granularity selector */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                {(['daily', 'weekly', 'monthly'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                      granularity === g
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <button
                onClick={loadAll}
                disabled={data.loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${data.loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* Error banner */}
        {data.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Connection Error</p>
              <p className="text-xs text-red-400/80 mt-0.5">{data.error}</p>
              <p className="text-xs text-slate-500 mt-1">
                Make sure Spring Boot backend is running: <code className="text-sky-400">cd backend && mvn spring-boot:run</code>
              </p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {data.loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        )}

        {/* Tab content */}
        {!data.loading && (
          <>
            {activeTab === 'overview'   && <OverviewTab   data={data} fmt={fmt} fmtPct={fmtPct} />}
            {activeTab === 'revenue'    && <RevenueTab    data={data} fmt={fmt} granularity={granularity} />}
            {activeTab === 'production' && <ProductionTab data={data} fmt={fmt} fmtPct={fmtPct} />}
            {activeTab === 'customers'  && <CustomersTab  data={data} fmt={fmt} />}
            {activeTab === 'cost'       && <CostTab       data={data} fmt={fmt} fmtPct={fmtPct} />}
            {activeTab === 'pipeline'   && <PipelineTab   data={data} fmt={fmt} fmtPct={fmtPct} />}
            {activeTab === 'ml'         && <MLPredictorTab />}
          </>
        )}
      </div>
    </div>
  );
};
