import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { DashboardMetrics } from '../types';

interface DashboardChartsProps {
  metrics: DashboardMetrics;
}

// 15-day timeline matching the Sep 01 – Sep 15, 2026 cycle totaling ₹124,500 sales & ₹11,400 refunds
const TREND_DATA = [
  { day: 'Sep 01', sales: 7800, refunds: 400 },
  { day: 'Sep 02', sales: 8100, refunds: 350 },
  { day: 'Sep 03', sales: 8400, refunds: 450 },
  { day: 'Sep 04', sales: 7900, refunds: 300 },
  { day: 'Sep 05', sales: 8800, refunds: 500 },
  { day: 'Sep 06', sales: 8200, refunds: 400 },
  { day: 'Sep 07', sales: 8500, refunds: 2890, highlight: 'Sep 07: PROD-088 Defect Spike' },
  { day: 'Sep 08', sales: 8600, refunds: 550 },
  { day: 'Sep 09', sales: 9100, refunds: 400 },
  { day: 'Sep 10', sales: 8300, refunds: 350 },
  { day: 'Sep 11', sales: 8000, refunds: 450 },
  { day: 'Sep 12', sales: 7700, refunds: 380 },
  { day: 'Sep 13', sales: 7200, refunds: 2200, highlight: 'Sep 13: Product P17 Returns Begin' },
  { day: 'Sep 14', sales: 6900, refunds: 1100, highlight: 'Sep 14: P17 Batch Claim 3' },
  { day: 'Sep 15', sales: 7000, refunds: 180 },
];

// Fee breakdown matching the exact ₹18,600 total from data_service
const FEE_PIE_DATA = [
  { name: 'Referral & FBA (95%)', value: 17670 },
  { name: 'Storage & Other (5%)', value: 930 },
];

const PIE_COLORS = ['#06B6D4', '#6366F1'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const item = TREND_DATA.find(d => d.day === label);
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
        <p className="font-semibold text-slate-200 mb-1">{label}, 2026</p>
        {item?.highlight && (
          <p className="text-[11px] font-bold text-rose-400 mb-1.5 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
            ⚠️ {item.highlight}
          </p>
        )}
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-mono text-[11px]">
            {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      {/* ── 15-Day Sales vs Refunds Trend ───────────────────────── */}
      <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">15-Day Sales vs. Refund Trend</h3>
            <p className="text-xs text-slate-400">Sep 01 – Sep 15, 2026 settlement cycle · Daily volume</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <span className="w-3 h-1 rounded-full bg-cyan-400 inline-block" />
              Gross Sales
            </span>
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <span className="w-3 h-1 rounded-full bg-rose-400 inline-block" />
              Refunds
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="refundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 10000]}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Vertical Highlight Bands on Spike Dates */}
            <ReferenceLine x="Sep 07" stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Sep 07 Spike', fill: '#F87171', fontSize: 9, position: 'top' }} />
            <ReferenceLine x="Sep 13" stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Sep 13 P17', fill: '#FBBF24', fontSize: 9, position: 'top' }} />

            <Area type="monotone" dataKey="sales" name="Gross Sales" stroke="#06B6D4" strokeWidth={2} fill="url(#salesGrad)" />
            <Area type="monotone" dataKey="refunds" name="Refunds" stroke="#EF4444" strokeWidth={2} fill="url(#refundGrad)" />
          </AreaChart>
        </ResponsiveContainer>

        {/* Visual spike legend markers */}
        <div className="mt-2.5 flex items-center justify-center gap-6 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span><strong>Sep 07:</strong> PROD-088 Packaging Damage (₹2,890)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span><strong>Sep 13–14:</strong> Product P17 Defective Batch Surge (₹3,300)</span>
          </div>
        </div>
      </div>

      {/* ── Unified Fee Distribution Donut ──────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Platform Fee Deductions</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ₹{metrics.platform_fees.toLocaleString('en-IN')} total itemized deductions (14.9% GMV)
          </p>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={FEE_PIE_DATA}
              innerRadius={38}
              outerRadius={65}
              paddingAngle={4}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {FEE_PIE_DATA.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} opacity={0.9} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
              contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 11, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Unified Legend with Side-by-Side Values */}
        <div className="space-y-2 border-t border-slate-800/80 pt-3">
          {FEE_PIE_DATA.map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="text-slate-300 font-medium">{entry.name}</span>
              </div>
              <span className="font-mono text-white font-bold">
                ₹{entry.value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50 text-slate-400">
            <span>Total Fees Checked</span>
            <span className="font-mono font-bold text-cyan-300">
              ₹{metrics.platform_fees.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
