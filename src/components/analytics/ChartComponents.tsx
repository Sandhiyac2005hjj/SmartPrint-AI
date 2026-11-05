/**
 * PrintPulse Analytics — Shared Chart Components
 * Pure SVG/React charts — no external charting library needed.
 */

import React from 'react';

// ── Colour palette ────────────────────────────────────────────────────────────
export const CHART_COLORS = [
  '#818cf8', '#34d399', '#fb923c', '#38bdf8', '#a78bfa',
  '#4ade80', '#f472b6', '#facc15', '#22d3ee', '#f87171',
];

// ── Formatters ────────────────────────────────────────────────────────────────
export function shortNum(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

export function shortCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label, value, sub, icon, trend, color = 'from-violet-600/20 to-violet-600/5', className = '',
}) => (
  <div className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${color} p-5 overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-white/[0.02]" />
    <div className="relative">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl bg-white/10 text-white">{icon}</div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            trend === 'up'   ? 'bg-emerald-500/20 text-emerald-400' :
            trend === 'down' ? 'bg-red-500/20 text-red-400' :
                               'bg-white/10 text-slate-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white mt-3">{value}</p>
      <p className="text-[11px] font-semibold text-slate-300 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
);

// ── Bar Chart (SVG) ───────────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (v: number) => string;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data, height = 200, formatValue = shortNum, title,
}) => {
  if (!data.length) return <EmptyState />;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(8, Math.min(40, Math.floor(480 / data.length) - 6));

  return (
    <div className="w-full">
      {title && <p className="text-xs font-semibold text-slate-400 mb-3">{title}</p>}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(400, data.length * (barW + 8))} ${height + 36}`}
          className="w-full"
          style={{ minWidth: Math.min(400, data.length * 40) }}
        >
          {data.map((d, i) => {
            const barH = Math.max(2, (d.value / max) * height);
            const x    = i * (barW + 8) + 4;
            const y    = height - barH;
            const col  = d.color ?? CHART_COLORS[i % CHART_COLORS.length];
            return (
              <g key={i}>
                {/* Bar */}
                <rect x={x} y={y} width={barW} height={barH}
                  rx={4} fill={col} opacity={0.85} />
                {/* Value label */}
                <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                  fontSize={9} fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                  {formatValue(d.value)}
                </text>
                {/* X label */}
                <text x={x + barW / 2} y={height + 18} textAnchor="middle"
                  fontSize={8} fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
                  {d.label.slice(0, 10)}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line x1={0} y1={height} x2={data.length * (barW + 8)} y2={height}
            stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
};

// ── Line Chart (SVG) ──────────────────────────────────────────────────────────
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
  title?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data, height = 180, color = '#818cf8', formatValue = shortNum, title,
}) => {
  if (data.length < 2) return <EmptyState />;

  const W = 480;
  const H = height;
  const max = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (d.value / max) * (H - 20),
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  // Show only every Nth label to prevent crowding
  const step = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="w-full">
      {title && <p className="text-xs font-semibold text-slate-400 mb-3">{title}</p>}
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full">
        <defs>
          <linearGradient id={`lg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(v => (
          <line key={v} x1={0} y1={H - v * (H - 20)} x2={W} y2={H - v * (H - 20)}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 4" />
        ))}
        {/* Area fill */}
        <path d={areaD} fill={`url(#lg-${color.replace('#', '')})`} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5}
            fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
        ))}
        {/* X labels */}
        {data.map((d, i) => (
          i % step === 0 && (
            <text key={i} x={pts[i].x} y={H + 16} textAnchor="middle"
              fontSize={8} fill="rgba(255,255,255,0.35)" fontFamily="sans-serif">
              {d.label.slice(0, 10)}
            </text>
          )
        ))}
      </svg>
    </div>
  );
};

// ── Donut Chart ───────────────────────────────────────────────────────────────
interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data, size = 140, centerLabel = 'Total', centerValue,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyState />;

  const R  = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  let   cumAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1    = cx + R * Math.cos(cumAngle);
    const y1    = cy + R * Math.sin(cumAngle);
    cumAngle   += angle;
    const x2    = cx + R * Math.cos(cumAngle);
    const y2    = cy + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const col   = d.color ?? CHART_COLORS[i % CHART_COLORS.length];
    return { d: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`, col };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.col} opacity={0.9} />
        ))}
        {/* Inner circle */}
        <circle cx={cx} cy={cy} r={R * 0.6} fill="rgba(0,0,0,0.6)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.5)">{centerLabel}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={14} fill="white" fontWeight="bold">
          {centerValue ?? total.toLocaleString()}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: d.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-[11px] text-slate-300 truncate max-w-[100px]">{d.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-white">{d.value.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">({((d.value / total) * 100).toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Horizontal Bar ────────────────────────────────────────────────────────────
interface HBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}

export const HBar: React.FC<HBarProps> = ({ label, value, max, color = '#818cf8', suffix = '' }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-slate-300 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-white/5 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-bold text-white w-20 text-right shrink-0">
        {typeof value === 'number' && value > 999 ? shortNum(value) : `${value}${suffix}`}
      </span>
    </div>
  );
};

// ── Data Table ────────────────────────────────────────────────────────────────
interface DataTableProps {
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
  rows: Record<string, unknown>[];
  formatCell?: (key: string, val: unknown) => string | React.ReactNode;
  maxRows?: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns, rows, formatCell, maxRows = 20,
}) => {
  const display = rows.slice(0, maxRows);
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {columns.map(c => (
              <th key={c.key}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-${c.align ?? 'left'}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {display.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">No data</td></tr>
          ) : display.map((row, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors">
              {columns.map(c => (
                <td key={c.key} className={`px-4 py-2.5 text-${c.align ?? 'left'} text-slate-200`}>
                  {formatCell ? formatCell(c.key, row[c.key]) : String(row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Section Card ──────────────────────────────────────────────────────────────
export const SectionCard: React.FC<{ title: string; sub?: string; children: React.ReactNode; className?: string }> = ({
  title, sub, children, className = '',
}) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
    <div className="mb-4">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {children}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ msg?: string }> = ({ msg = 'No data available. Run the ETL pipeline first.' }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
      <span className="text-2xl">📊</span>
    </div>
    <p className="text-sm text-slate-500">{msg}</p>
  </div>
);

// ── Stat Badge ────────────────────────────────────────────────────────────────
export const StatBadge: React.FC<{ label: string; value: string | number; color?: string }> = ({
  label, value, color = 'text-violet-300',
}) => (
  <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10">
    <span className={`text-xl font-black ${color}`}>{String(value)}</span>
    <span className="text-[10px] text-slate-500 mt-0.5 text-center">{label}</span>
  </div>
);

// ── Risk Badge ────────────────────────────────────────────────────────────────
export const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    HIGH:   'bg-red-500/20 text-red-400 border-red-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${map[level] ?? 'bg-white/10 text-white border-white/20'}`}>
      {level} RISK
    </span>
  );
};
