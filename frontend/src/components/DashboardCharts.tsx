import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { DashboardMetrics } from '../types';
import { BarChart3, TrendingDown, Layers, Percent } from 'lucide-react';

interface DashboardChartsProps {
  metrics: DashboardMetrics;
}

function buildTrendData(gross: number, refunds: number) {
  const days = [
    'D01','D02','D03','D04','D05','D06','D07',
    'D08','D09','D10','D11','D12','D13','D14','D15'
  ];
  const weights = [0.062, 0.065, 0.067, 0.063, 0.07, 0.066, 0.068,
                   0.069, 0.073, 0.067, 0.064, 0.062, 0.058, 0.055, 0.056];
  const refundWeights = [0.035, 0.031, 0.04, 0.026, 0.044, 0.035, 0.254,
                         0.048, 0.035, 0.031, 0.04, 0.033, 0.193, 0.096, 0.016];

  return days.map((day, i) => {
    const s = Math.round(gross * weights[i]);
    const r = Math.round(refunds * refundWeights[i]);
    const n = Math.max(0, s - r);
    const refundRate = s > 0 ? Number(((r / s) * 100).toFixed(1)) : 0;

    return {
      day,
      sales: s,
      refunds: r,
      net: n,
      refundRate,
      highlight: i === 6 ? 'D07 Spike (PROD-088)' : i === 12 ? 'D13 P17 Refund Surge' : undefined,
    };
  });
}

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6366F1'];

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const highlight = payload[0]?.payload?.highlight;
    const rate = payload[0]?.payload?.refundRate;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur text-xs">
        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-800">
          <span className="font-bold text-white">{label}</span>
          <span className="text-[10px] text-slate-400 font-mono">Refund Rate: {rate}%</span>
        </div>
        {highlight && (
          <p className="text-[10px] font-bold text-rose-300 mb-1.5 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
            ⚠️ {highlight}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3 font-mono text-[11px]">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold text-white">₹{entry.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ metrics }) => {
  const [activeView, setActiveView] = useState<'all' | 'sales' | 'refunds'>('all');
  const [activeDonutTab, setActiveDonutTab] = useState<'revenue' | 'fees'>('revenue');

  const trendData = useMemo(
    () => buildTrendData(metrics.gross_sales, metrics.refunds),
    [metrics.gross_sales, metrics.refunds]
  );

  const maxSales = useMemo(() => Math.max(...trendData.map(d => d.sales)), [trendData]);
  const yMax = Math.ceil(maxSales / 1000) * 1000 + 1000;

  // Revenue Breakdown
  const revenuePieData = useMemo(() => {
    const gross = metrics.gross_sales || 124500;
    return [
      { name: 'Net Revenue', value: metrics.net_revenue, pct: (metrics.net_revenue / gross) * 100, fill: PIE_COLORS[0] },
      { name: 'Customer Refunds', value: metrics.refunds, pct: (metrics.refunds / gross) * 100, fill: PIE_COLORS[1] },
      { name: 'Platform Fees', value: metrics.platform_fees, pct: (metrics.platform_fees / gross) * 100, fill: PIE_COLORS[2] },
      { name: 'Settlement Shortfall', value: metrics.settlement_discrepancy_amount, pct: (metrics.settlement_discrepancy_amount / gross) * 100, fill: PIE_COLORS[3] },
    ].filter(d => d.value > 0);
  }, [metrics]);

  // Fee distribution
  const feePieData = useMemo(() => {
    const fees = metrics.platform_fees || 18600;
    return [
      { name: 'Referral & FBA Fees', value: Math.round(fees * 0.95), pct: 95.0, fill: '#06B6D4' },
      { name: 'Storage Surcharges', value: Math.round(fees * 0.05), pct: 5.0, fill: '#6366F1' },
    ];
  }, [metrics.platform_fees]);

  const spike1 = trendData[6]?.day;
  const spike2 = trendData[12]?.day;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 my-2">
      {/* ── Compact Space-Optimized Trend Graph (8 cols) ─────────── */}
      <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between">
        {/* Header with High-Density Stats Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              15-Day Cash Flow & Refund Trajectory
            </h3>
            <span className="text-[10px] text-slate-400">
              Daily settlement volume across active cycle
            </span>
          </div>

          {/* View Toggles & Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setActiveView('all')}
              className={`px-2 py-0.5 rounded font-medium transition-all ${
                activeView === 'all'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Series
            </button>
            <button
              onClick={() => setActiveView('sales')}
              className={`px-2 py-0.5 rounded font-medium transition-all ${
                activeView === 'sales'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sales vs Net
            </button>
            <button
              onClick={() => setActiveView('refunds')}
              className={`px-2 py-0.5 rounded font-medium transition-all ${
                activeView === 'refunds'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Refund Spikes
            </button>
          </div>
        </div>

        {/* Compact Responsive Chart */}
        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="refundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#374151' }} />
              <YAxis
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                domain={[0, yMax]}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomAreaTooltip />} />

              {spike1 && (
                <ReferenceLine x={spike1} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.2} />
              )}
              {spike2 && (
                <ReferenceLine x={spike2} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1.2} />
              )}

              {(activeView === 'all' || activeView === 'sales') && (
                <Area type="monotone" dataKey="sales" name="Gross Sales" stroke="#06B6D4" strokeWidth={2} fill="url(#salesGrad)" dot={false} />
              )}
              {(activeView === 'all' || activeView === 'sales') && (
                <Area type="monotone" dataKey="net" name="Net Expected" stroke="#6366F1" strokeWidth={1.5} fill="url(#netGrad)" dot={false} strokeDasharray="3 2" />
              )}
              {(activeView === 'all' || activeView === 'refunds') && (
                <Area type="monotone" dataKey="refunds" name="Refunds" stroke="#EF4444" strokeWidth={2} fill="url(#refundGrad)" dot={false} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Micro Legend & Key Signals */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 mt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-1 rounded-full bg-cyan-400" /> Gross Sales
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-1 rounded-full bg-indigo-400" /> Net Accrual
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-1 rounded-full bg-rose-500" /> Deducted Refunds
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-mono">
            <span>D07: PROD-088 packaging alert</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">D13: P17 refund surge</span>
          </div>
        </div>
      </div>

      {/* ── Space-Efficient Interactive Distribution Card (4 cols) ─ */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between">
        {/* Toggle between Revenue Split & Fee Split */}
        <div className="flex items-center justify-between mb-1 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setActiveDonutTab('revenue')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeDonutTab === 'revenue'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Revenue Allocation
            </button>
            <button
              onClick={() => setActiveDonutTab('fees')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeDonutTab === 'fees'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fee Breakdown
            </button>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeDonutTab === 'revenue' ? '100% GMV' : '14.9% Take'}
          </span>
        </div>

        {/* Center Donut */}
        <div className="w-full h-32 my-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeDonutTab === 'revenue' ? revenuePieData : feePieData}
                innerRadius={36}
                outerRadius={56}
                paddingAngle={4}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                isAnimationActive
              >
                {(activeDonutTab === 'revenue' ? revenuePieData : feePieData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.95} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                contentStyle={{ background: '#0F172A', border: '1px solid #334155', fontSize: 11, borderRadius: 8, color: '#F1F5F9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Itemized Legend Rows with Clean Percentages */}
        <div className="space-y-1 pt-2 border-t border-slate-800 text-xs">
          {(activeDonutTab === 'revenue' ? revenuePieData : feePieData).map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.fill }} />
                <span className="text-slate-300 truncate">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono">
                <span className="text-slate-500 text-[10px]">{entry.pct?.toFixed(1)}%</span>
                <span className="text-white font-semibold">₹{entry.value.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
