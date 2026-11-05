/**
 * PrintPulse Analytics — API Service Layer
 * Calls the Spring Boot /api/analytics/* endpoints.
 * All functions return typed results and handle errors gracefully.
 */

const API_BASE = 'http://localhost:8080/api/analytics';

async function fetchJson<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    console.warn(`[Analytics API] ${endpoint} failed:`, err);
    return null;
  }
}

export interface KpiSummary {
  total_orders: number;
  total_customers: number;
  total_revenue: number;
  total_collected: number;
  total_outstanding: number;
  delivered_count: number;
  cancelled_count: number;
  active_count: number;
  on_time_rate_pct: number;
  avg_order_value: number;
  gross_margin_pct: number;
  total_waste_sheets: number;
  rework_jobs_count: number;
}

export interface RevenueRow {
  date_bucket: string;
  order_count: number;
  total_revenue: number;
  total_collected: number;
  total_outstanding: number;
  avg_order_value: number;
}

export interface JobTypeRow {
  job_type: string;
  order_count: number;
  total_revenue: number;
  avg_revenue: number;
  avg_quantity: number;
  delivered_count: number;
  cancelled_count: number;
  delivery_rate_pct: number;
}

export interface OnTimeByTypeRow {
  job_type: string;
  delivered_count: number;
  on_time_count: number;
  on_time_rate_pct: number;
}

export interface StatusRow {
  status: string;
  job_count: number;
  pct_of_total: number;
  total_value: number;
  avg_value: number;
}

export interface OnTimeRow {
  total_delivered: number;
  on_time_count: number;
  late_count: number;
  on_time_rate_pct: number;
  avg_promised_lead_days: number;
  avg_actual_lead_days: number;
}

export interface OverdueRow {
  job_no: string;
  customer_name: string;
  company: string;
  job_type: string;
  product_name: string;
  priority: string;
  status: string;
  promised_date: string;
  days_overdue: number;
  selling_price: number;
  balance_amount: number;
  payment_status: string;
}

export interface PipelineRun {
  run_id: string;
  started_at: string;
  finished_at: string;
  status: string;
  source_file: string;
  total_records: number;
  accepted_records: number;
  rejected_records: number;
  acceptance_rate_pct: number;
  duration_secs: number;
  error_message: string | null;
}

export interface DataQuality {
  total_records_processed: number;
  total_accepted: number;
  total_rejected: number;
  overall_acceptance_rate_pct: number;
  overall_error_rate_pct: number;
  total_pipeline_runs: number;
  successful_runs: number;
  failed_runs: number;
  pipeline_success_rate_pct: number;
}

export interface CostMarginRow {
  job_type: string;
  order_count: number;
  avg_estimated_cost: number;
  avg_selling_price: number;
  total_gross_profit: number;
  gross_margin_pct: number;
  avg_margin_pct: number;
}

export interface QuarantineRule {
  rejection_rule: string;
  rejection_count: number;
  first_seen: string;
  last_seen: string;
}

export interface RepeatCustomer {
  customer_name: string;
  company: string;
  total_orders: number;
  lifetime_value: number;
  avg_order_value: number;
  first_order_date: string;
  last_order_date: string;
}

export const analyticsApi = {
  getKpi: ()                           => fetchJson<KpiSummary>('/kpi'),
  getRevenue: (g = 'monthly')          => fetchJson<RevenueRow[]>(`/revenue?granularity=${g}`),
  getRevenueByType: ()                 => fetchJson<JobTypeRow[]>('/revenue-by-type'),
  getOrderVolume: (g = 'monthly')      => fetchJson<RevenueRow[]>(`/order-volume?granularity=${g}`),
  getStatusSummary: ()                 => fetchJson<StatusRow[]>('/status-summary'),
  getOnTimeDelivery: ()                => fetchJson<OnTimeRow>('/on-time-delivery'),
  getOnTimeByType: ()                  => fetchJson<OnTimeByTypeRow[]>('/on-time-by-type'),
  getOverdueJobs: ()                   => fetchJson<OverdueRow[]>('/overdue-jobs'),
  getRepeatCustomers: ()               => fetchJson<RepeatCustomer[]>('/repeat-customers'),
  getCostMargin: ()                    => fetchJson<CostMarginRow[]>('/cost-margin'),
  getPipelineRuns: ()                  => fetchJson<PipelineRun[]>('/pipeline-runs'),
  getDataQuality: ()                   => fetchJson<DataQuality>('/data-quality'),
  getQuarantineByRule: ()              => fetchJson<QuarantineRule[]>('/quarantine-by-rule'),
};
