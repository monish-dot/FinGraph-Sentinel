import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { DashboardMetrics } from '../types';

interface DashboardChartsProps {
  metrics: DashboardMetrics;
}

const TREND_DATA = [
  { day: 'Sep 1', sales: 78000, refunds: 1800 },
  { day: 'Sep 3', sales: 82000, refunds: 1600 },
  { day: 'Sep 5', sales: 90000, refunds: 2000 },
  { day: 'Sep 7', sales: 85000, refunds: 7200 },
  { day: 'Sep 9', sales: 95000, refunds: 2200 },
  { day: 'Sep 11', sales: 88000, refunds: 2800 },
  { day: 'Sep 13', sales: 79000, refunds: 11900 },
  { day: 'Sep 15', sales: 73000, refunds: 4400 },
];

const FEE_PIE_DATA = [
  { name: 'Referral & FBA (95%)', value: 177400 },
  { name: 'Storage & Other (5%)', value: 9350 },
];

const PIE_COLORS = ['#06B6D4', '#6366F1'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
        <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-mono">
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
      {/* Sales vs Refunds Trend */}
      <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">14-Day Sales vs. Refund Trend</h3>
            <p className="text-xs text-slate-400">Sep 01 – Sep 15, 2026 settlement cycle</p>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-3 h-1 rounded-full bg-cyan-400 inline-block" />
              Gross Sales
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-3 h-1 rounded-full bg-rose-400 inline-block" />
              Refunds
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={TREND_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="refundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={false}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="sales" name="Gross Sales" stroke="#06B6D4" strokeWidth={2} fill="url(#salesGrad)" />
            <Area type="monotone" dataKey="refunds" name="Refunds" stroke="#EF4444" strokeWidth={2} fill="url(#refundGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 text-[10px] text-amber-400/80 text-center">
          ↑ Refund spike on Sep 7 (PROD-088) and Sep 13 (Product P17) visible in trend
        </div>
      </div>

      {/* Fee Distribution Donut */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Fee Distribution</h3>
          <p className="text-xs text-slate-400">₹{metrics.platform_fees.toLocaleString('en-IN')} total deductions</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={FEE_PIE_DATA}
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {FEE_PIE_DATA.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} opacity={0.85} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
              contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 11, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 mt-1">
          {FEE_PIE_DATA.map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-slate-400">{entry.name}</span>
              </div>
              <span className="font-mono text-slate-200">₹{entry.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
