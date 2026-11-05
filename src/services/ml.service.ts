/**
 * PrintPulse Analytics — ML Prediction API Service
 * Calls the Python Flask service on port 5001.
 *
 * ⚠ EXPERIMENTAL — Results based on synthetic training data only.
 *   Do not use for actual business decisions.
 */

const ML_API_BASE = 'http://localhost:5001/api/ml';

async function mlFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${ML_API_BASE}${path}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    console.warn(`[ML API] ${path} failed:`, err);
    return null;
  }
}

export interface MlHealth {
  status: string;
  model_loaded: boolean;
  model_name: string | null;
  trained_at: string | null;
  disclaimer: string;
}

export interface DelayFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  detail: string;
}

export interface DelayPrediction {
  predicted_delayed: boolean;
  delay_probability: number;
  on_time_probability: number;
  risk_level: 'High' | 'Medium' | 'Low';
  risk_color: string;
  top_factors: DelayFactor[];
  model_name: string;
  disclaimer: string;
}

export interface PredictRequest {
  job_type: string;
  quantity: number;
  priority: string;
  print_type: string;
  lamination: string;
  finishing: string;
  print_sides: string;
  estimated_cost: number;
  lead_days: number;
  day_of_week: number;
}

export interface CompletionFactor {
  factor: string;
  days: number;
}

export interface CompletionPrediction {
  predicted_days: number;
  raw_days: number;
  job_date: string;
  predicted_completion_date: string;
  expected_delivery_date?: string;
  is_delay_risk: boolean;
  days_difference: number;
  status: 'EXPEDITE_REQUIRED' | 'TIGHT_SCHEDULE' | 'ON_TRACK';
  message: string;
  accuracy_r2: number;
  mae_days: number;
  acc_within_2_days_pct: number;
  factors: CompletionFactor[];
}

export interface PredictCompletionRequest {
  job_type: string;
  quantity: number;
  priority: string;
  print_type?: string;
  print_lamination?: string;
  print_finishing?: string;
  print_sides?: string;
  job_date?: string;
  expected_delivery_date?: string;
}

export const mlApi = {
  health: () => mlFetch<MlHealth>('/health'),

  modelInfo: () => mlFetch<Record<string, unknown>>('/model-info'),

  predictDelay: (payload: PredictRequest) =>
    mlFetch<DelayPrediction>('/predict-delay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  predictCompletion: (payload: PredictCompletionRequest) =>
    mlFetch<CompletionPrediction>('/predict-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};
