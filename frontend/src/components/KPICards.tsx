import React from 'react';
import {
  TrendingUp, Receipt, Undo2, RotateCcw,
  Wallet, Landmark, AlertTriangle, ChevronRight
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface KPICardsProps {
  metrics: DashboardMetrics;
  onViewAnomalies: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics, onViewAnomalies }) => {
  // Expected settlement = Net Revenue before discrepancy = ₹94,500
  const expectedSettlement = metrics.net_revenue;
  const actualSettlement = metrics.settlement_amount;
  const discrepancy = metrics.settlement_discrepancy_amount;

  return (
    <div className="space-y-3.5 my-4">
      {/* ── ROW 1: Macro Business Performance (4 cards) ───────────── */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Macro Cycle Performance (Sep 01 – Sep 15, 2026)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Gross Sales */}
          <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Gross Sales</span>
              <div className="p-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/40">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{metrics.gross_sales.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Completed marketplace orders</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-semibold">
                Baseline
              </span>
            </div>
          </div>

          {/* 2. Platform Fees */}
          <div className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Platform Fees</span>
              <div className="p-1.5 rounded-lg bg-amber-900/40 border border-amber-700/40">
                <Receipt className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{metrics.platform_fees.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Referral, FBA & Storage</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 text-[10px] font-semibold">
                14.9% of GMV
              </span>
            </div>
          </div>

          {/* 3. Customer Refunds */}
          <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Customer Refunds</span>
              <div className="p-1.5 rounded-lg bg-rose-900/40 border border-rose-700/40">
                <Undo2 className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{metrics.refunds.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Includes ₹3.3k P17 surge</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 text-[10px] font-semibold">
                9.1% rate (Elevated)
              </span>
            </div>
          </div>

          {/* 4. Net Revenue (Accrued) */}
          <div className="p-4 rounded-xl border border-cyan-800/40 bg-cyan-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Net Expected Accrual</span>
              <div className="p-1.5 rounded-lg bg-cyan-900/40 border border-cyan-700/40">
                <Wallet className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{expectedSettlement.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Sales − Fees − Refunds</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 text-[10px] font-semibold">
                Expected Payout
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Settlement Cycle Health & Anomalies (3 cards) ─────── */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Disbursement Reconciliation & Review
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 5. Actual Settlement Disbursed */}
          <div className="p-4 rounded-xl border border-blue-800/40 bg-blue-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Settlement Disbursed</span>
              <div className="p-1.5 rounded-lg bg-blue-900/40 border border-blue-700/40">
                <Landmark className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{actualSettlement.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Deposited to HDFC Bank</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] font-semibold">
                Cycle SET-1029
              </span>
            </div>
          </div>

          {/* 6. Settlement Shortfall / Discrepancy */}
          <div className={`p-4 rounded-xl border ${
            discrepancy > 0 ? 'border-rose-600/70 bg-rose-950/40 ring-1 ring-rose-500/20' : 'border-emerald-800/40 bg-emerald-950/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Reconciliation Discrepancy</span>
              <div className="p-1.5 rounded-lg bg-rose-900/60 border border-rose-500/50">
                <AlertTriangle className="w-4 h-4 text-rose-300" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-rose-300 tracking-tight">
              −₹{discrepancy.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-rose-200 font-medium">Expected ₹94.5k vs Actual ₹91.2k</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-600 text-[10px] font-bold">
                Requires Review
              </span>
            </div>
          </div>

          {/* 7. Active Anomalies Card */}
          <div
            onClick={onViewAnomalies}
            className="p-4 rounded-xl border border-amber-600/60 bg-amber-950/30 cursor-pointer hover:border-amber-400 hover:bg-amber-950/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Active Anomalies</span>
              <div className="p-1.5 rounded-lg bg-amber-900/50 border border-amber-600/50 flex items-center gap-1 text-amber-300 group-hover:text-white transition-colors">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {metrics.active_anomalies_count} Events Detected
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">3 High Priority / 4 Medium</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-600 text-[10px] font-bold">
                View All →
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
