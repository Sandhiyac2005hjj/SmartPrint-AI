/**
 * PrintPulse Analytics — ML Production Turnaround & Completion Predictor
 * =====================================================================
 * Interactive form calling the Gradient Boosting Regressor model to predict
 * physical production turnaround days, completion date, and expedite alerts.
 */

import React, { useState, useEffect } from 'react';
import { Brain, Zap, AlertTriangle, CheckCircle2, Clock, Calendar, RefreshCw, Flame } from 'lucide-react';
import { StatBadge, SectionCard, EmptyState } from '../ChartComponents';
import { CompletionPrediction } from '../../../services/ml.service';

const ML_SERVICE_URL = 'http://localhost:5001';

interface FormValues {
  job_type: string;
  quantity: number;
  priority: string;
  print_type: string;
  print_lamination: string;
  print_finishing: string;
  print_sides: string;
  job_date: string;
  expected_delivery_date: string;
}

const JOB_TYPES = [
  'Visiting Card',
  'Brochure',
  'Packaging Box',
  'Poster',
  'Flex',
  'Catalogue',
  'Letterhead',
  'Sticker',
  'Envelope',
  'Label',
  'Standee',
  'Bill Book',
  'Invitation',
  'Carry Bag',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PRINT_TYPES = ['Digital', 'Offset', 'Wide Format Outdoor', 'Screen Print', 'UV Print'];
const LAMINATIONS = ['None', 'Gloss Thermal', 'Matt Thermal', 'Velvet Touch', 'Spot UV'];
const FINISHINGS = ['None', 'Foil Stamping', 'Embossing', 'Spot UV', 'Die Cutting'];
const SIDES = ['Single Side', 'Double Side'];

const todayStr = new Date().toISOString().split('T')[0];
const threeDaysLaterStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

const DEFAULT_FORM: FormValues = {
  job_type: 'Visiting Card',
  quantity: 500,
  priority: 'Medium',
  print_type: 'Digital',
  print_lamination: 'None',
  print_finishing: 'None',
  print_sides: 'Single Side',
  job_date: todayStr,
  expected_delivery_date: threeDaysLaterStr,
};

export const MLPredictorTab: React.FC = () => {
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [result, setResult] = useState<CompletionPrediction | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUrl, setServiceUrl] = useState(ML_SERVICE_URL);

  useEffect(() => {
    fetchModelInfo();
  }, [serviceUrl]);

  const fetchModelInfo = async () => {
    setModelLoading(true);
    try {
      const res = await fetch(`${serviceUrl}/api/ml/model-info`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const info = await res.json();
      setModelInfo(info.completion_model || info);
      setError(null);
    } catch (e) {
      setModelInfo(null);
      setError(`ML service not reachable at ${serviceUrl}. Ensure Flask is running on port 5001.`);
    } finally {
      setModelLoading(false);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serviceUrl}/api/ml/predict-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof FormValues, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const inputClass =
    'w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors';
  const labelClass = 'block text-[11px] font-semibold text-slate-400 mb-1.5';

  const metrics = modelInfo?.metrics || {
    r2_score: 0.6566,
    mae_days: 1.46,
    median_ae_days: 1.26,
    acc_within_2_days_pct: 75.3,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-purple-900/30 to-slate-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI Job Turnaround & Completion Predictor</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  R² {(metrics.r2_score * 100).toFixed(0)}% • ±{metrics.mae_days}d MAE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gradient Boosting Regressor predicting physical shop-floor turnaround days from job specifications and detecting deadline delay risks.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Trained Samples</span>
            <span className="font-mono text-xs font-bold text-white">
              {Number(modelInfo?.training_samples || 3255).toLocaleString()} jobs
            </span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-300">{error}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Start the ML service with: <code className="text-sky-400 font-mono">python analytics/ml/predict_service.py</code>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Form */}
        <SectionCard title="Job Specifications" sub="Enter physical specs to predict turnaround and deadline feasibility">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Job Category</label>
              <select className={inputClass} value={form.job_type} onChange={(e) => set('job_type', e.target.value)}>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Quantity (Pcs)</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.quantity}
                onChange={(e) => set('quantity', parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className={labelClass}>Priority Level</label>
              <select className={inputClass} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Print Technology</label>
              <select className={inputClass} value={form.print_type} onChange={(e) => set('print_type', e.target.value)}>
                {PRINT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Lamination</label>
              <select
                className={inputClass}
                value={form.print_lamination}
                onChange={(e) => set('print_lamination', e.target.value)}
              >
                {LAMINATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Finishing & Accents</label>
              <select
                className={inputClass}
                value={form.print_finishing}
                onChange={(e) => set('print_finishing', e.target.value)}
              >
                {FINISHINGS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Order Job Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.job_date}
                onChange={(e) => set('job_date', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Promised Delivery Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.expected_delivery_date}
                onChange={(e) => set('expected_delivery_date', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Print Sides</label>
              <select className={inputClass} value={form.print_sides} onChange={(e) => set('print_sides', e.target.value)}>
                {SIDES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Calculating Turnaround…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> ⚡ Predict Turnaround & Feasibility
              </>
            )}
          </button>

          {/* Service URL toggle */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <label className="block text-[10px] text-slate-500 mb-1">Microservice Endpoint</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-400 font-mono"
              value={serviceUrl}
              onChange={(e) => setServiceUrl(e.target.value)}
            />
          </div>
        </SectionCard>

        {/* Prediction Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <SectionCard
                title={
                  result.status === 'EXPEDITE_REQUIRED'
                    ? '⚠️ Expedite Required Alert'
                    : result.status === 'TIGHT_SCHEDULE'
                    ? '⏱️ Tight Delivery Schedule'
                    : '✅ On-Track Delivery Feasible'
                }
                className={
                  result.status === 'EXPEDITE_REQUIRED'
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : result.status === 'TIGHT_SCHEDULE'
                    ? 'border-sky-500/40 bg-sky-500/10'
                    : 'border-emerald-500/40 bg-emerald-500/10'
                }
              >
                {/* Main KPIs */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Estimated Turnaround
                    </span>
                    <span className="text-3xl font-black text-violet-300 font-mono">
                      {result.predicted_days} Days
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Raw: {result.raw_days} days</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      AI Ready Date
                    </span>
                    <span className="text-xl font-black text-white font-mono mt-1">
                      {result.predicted_completion_date}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Target: {result.expected_delivery_date || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Status Notice */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    result.status === 'EXPEDITE_REQUIRED'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : result.status === 'TIGHT_SCHEDULE'
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <p className="text-xs font-semibold leading-relaxed">{result.message}</p>
                </div>

                {/* Factors Breakdown */}
                {result.factors && result.factors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <p className="text-[11px] font-bold text-slate-300">Production Time Breakdown Factors:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.factors.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs"
                        >
                          <span className="text-slate-300 text-[11px]">{f.factor}</span>
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              f.days > 0 ? 'text-violet-400' : 'text-emerald-400'
                            }`}
                          >
                            {f.days > 0 ? `+${f.days}d` : `${f.days}d`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            </>
          ) : (
            <SectionCard title="Turnaround Estimation" sub="Configure specifications and click Predict">
              <EmptyState msg="No prediction yet. Adjust job parameters and click 'Predict Turnaround & Feasibility'." />
            </SectionCard>
          )}

          {/* Model Information Panel */}
          {modelInfo && (
            <SectionCard title="Trained Model Performance" sub="Gradient Boosting Regressor metrics">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <StatBadge
                  label="R² Score"
                  value={`${(metrics.r2_score * 100).toFixed(1)}%`}
                  color="text-emerald-400"
                />
                <StatBadge
                  label="Mean Abs. Error"
                  value={`±${metrics.mae_days}d`}
                  color="text-violet-300"
                />
                <StatBadge
                  label="Median Error"
                  value={`±${metrics.median_ae_days || 1.26}d`}
                  color="text-sky-300"
                />
                <StatBadge
                  label="Within ±2 Days"
                  value={`${metrics.acc_within_2_days_pct || 75.3}%`}
                  color="text-amber-300"
                />
              </div>

              {modelInfo.feature_importances && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Driving Features:</p>
                  {Object.entries(modelInfo.feature_importances)
                    .slice(0, 5)
                    .map(([feat, imp]: [string, any]) => (
                      <div key={feat} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-300 w-32 capitalize truncate">
                          {feat.replace(/_/g, ' ')}
                        </span>
                        <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${Math.min(100, imp * 100 * 2.2)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-violet-300 w-10 text-right">
                          {(imp * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </SectionCard>
          )}

          {modelLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Connecting to ML turnaround model…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
