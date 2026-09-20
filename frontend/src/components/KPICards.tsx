import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  Undo2,
  Wallet,
  Landmark,
  AlertTriangle,
  ChevronRight,
  X,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface KPICardsProps {
  metrics: DashboardMetrics;
  onViewAnomalies: () => void;
  onInvestigateDiscrepancy?: () => void;
}

interface DetailModalState {
  title: string;
  category: string;
  color: string;
  amount: string;
  subtitle: string;
  items: { label: string; value: string; note?: string; highlight?: boolean }[];
  actionLabel?: string;
  onAction?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  metrics,
  onViewAnomalies,
  onInvestigateDiscrepancy
}) => {
  const [activeModal, setActiveModal] = useState<DetailModalState | null>(null);

  const expectedSettlement = metrics.net_revenue;
  const actualSettlement = metrics.settlement_amount;
  const discrepancy = metrics.settlement_discrepancy_amount;

  const handleCardClick = (type: string) => {
    switch (type) {
      case 'gross':
        setActiveModal({
          title: 'Gross Sales Composition',
          category: 'REVENUE AUDIT',
          color: 'emerald',
          amount: `₹${metrics.gross_sales.toLocaleString('en-IN')}`,
          subtitle: 'Total recorded marketplace gross order volume across active cycle',
          items: [
            { label: 'Settlement Cycle', value: metrics.settlement_cycle || 'Sep 01 – Sep 15, 2026' },
            { label: 'Merchant', value: metrics.seller_name || 'Apex Retailers (Amazon IN)' },
            { label: 'Accounting Principle', value: 'Accrual Basis (Gross Orders Placed)' },
            { label: 'Ledger Integrity', value: '100% Matched with Marketplace Order IDs', highlight: true }
          ]
        });
        break;

      case 'fees':
        setActiveModal({
          title: 'Platform Fee Deductions',
          category: 'FEE BREAKDOWN',
          color: 'amber',
          amount: `₹${metrics.platform_fees.toLocaleString('en-IN')}`,
          subtitle: 'Itemized marketplace commission and fulfillment deductions',
          items: [
            { label: 'Referral & FBA Fulfillment (95%)', value: `₹${Math.round(metrics.platform_fees * 0.95).toLocaleString('en-IN')}`, note: 'Per-unit pick, pack & delivery' },
            { label: 'Storage & Other Charges (5%)', value: `₹${Math.round(metrics.platform_fees * 0.05).toLocaleString('en-IN')}`, note: 'Warehouse duration & weight surcharges' },
            { label: 'Effective Take Rate', value: `${((metrics.platform_fees / (metrics.gross_sales || 1)) * 100).toFixed(1)}% of GMV` },
            { label: 'Verification Status', value: 'Deterministic re-computation verified', highlight: true }
          ]
        });
        break;

      case 'refunds':
        setActiveModal({
          title: 'Customer Refund Deductions',
          category: 'DEDUCTION ANALYSIS',
          color: 'rose',
          amount: `₹${metrics.refunds.toLocaleString('en-IN')}`,
          subtitle: 'Customer returns and late defect adjustments debited from cycle',
          items: [
            { label: 'Product P17 Defective Batch Spike', value: '₹3,300 (3 claims × ₹1,100)', highlight: true, note: 'Primary driver of settlement discrepancy' },
            { label: 'PROD-088 Damaged Packaging Spike', value: '₹2,890 (7 claims)', note: 'Carrier handling failure' },
            { label: 'Normal Baseline Refund Rate', value: '2.1% of orders' },
            { label: 'Observed Cycle Refund Rate', value: `${((metrics.refunds / (metrics.gross_sales || 1)) * 100).toFixed(1)}% (Elevated 4.3×)` }
          ]
        });
        break;

      case 'net':
        setActiveModal({
          title: 'Net Expected Accrual Formula',
          category: 'MATHEMATICAL RECONCILIATION',
          color: 'cyan',
          amount: `₹${expectedSettlement.toLocaleString('en-IN')}`,
          subtitle: 'Deterministic accrual formula calculated prior to bank clearance',
          items: [
            { label: 'Gross Marketplace Sales', value: `+₹${metrics.gross_sales.toLocaleString('en-IN')}` },
            { label: 'Less: Platform Commission & Fees', value: `−₹${metrics.platform_fees.toLocaleString('en-IN')}` },
            { label: 'Less: Customer Returns & Refunds', value: `−₹${metrics.refunds.toLocaleString('en-IN')}` },
            { label: 'Equals: Net Expected Accrual', value: `₹${expectedSettlement.toLocaleString('en-IN')}`, highlight: true }
          ]
        });
        break;

      case 'actual':
        setActiveModal({
          title: 'Settlement Bank Disbursement Record',
          category: 'BANK CLEARANCE',
          color: 'blue',
          amount: `₹${actualSettlement.toLocaleString('en-IN')}`,
          subtitle: 'Actual payout cleared to merchant corporate bank account',
          items: [
            { label: 'Settlement ID', value: 'SET-1029' },
            { label: 'Designated Depository', value: 'HDFC Corporate (•••• 9912)' },
            { label: 'Bank UTR Reference', value: 'UTR-HDFC-20260916-99214' },
            { label: 'Clearance Status', value: 'CLEARED & SETTLED', highlight: true }
          ]
        });
        break;

      case 'discrepancy':
        if (discrepancy > 0) {
          setActiveModal({
            title: 'Reconciliation Discrepancy Breakdown',
            category: 'VARIANCE ALERT',
            color: 'rose',
            amount: `−₹${discrepancy.toLocaleString('en-IN')}`,
            subtitle: 'Net payout gap between expected accrual and bank disbursement',
            items: [
              { label: 'Expected Accrual Amount', value: `₹${expectedSettlement.toLocaleString('en-IN')}` },
              { label: 'Actual Cleared Disbursement', value: `₹${actualSettlement.toLocaleString('en-IN')}` },
              { label: 'Net Discrepancy Gap', value: `−₹${discrepancy.toLocaleString('en-IN')}`, highlight: true },
              { label: 'Root Cause Hypothesis', value: '3× P17 defect refunds debited right before cutoff', note: 'Variance explained: 100%' }
            ],
            actionLabel: 'Launch Investigation →',
            onAction: () => {
              setActiveModal(null);
              if (onInvestigateDiscrepancy) {
                onInvestigateDiscrepancy();
              } else {
                onViewAnomalies();
              }
            }
          });
        }
        break;

      case 'anomalies':
        onViewAnomalies();
        break;
    }
  };

  return (
    <div className="space-y-3.5 my-4">
      {/* Detail Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-700/90 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                  {activeModal.category}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{activeModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeModal.subtitle}</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Metric Value</span>
              <span className="text-xl font-mono font-bold text-white">{activeModal.amount}</span>
            </div>

            <div className="space-y-2">
              {activeModal.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                    item.highlight
                      ? 'border-cyan-700/60 bg-cyan-950/20 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-200 block truncate">{item.label}</span>
                    {item.note && <span className="text-[10px] text-slate-500 block truncate">{item.note}</span>}
                  </div>
                  <span className={`font-mono font-bold shrink-0 ${item.highlight ? 'text-cyan-300' : 'text-white'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              {activeModal.actionLabel && activeModal.onAction && (
                <button
                  onClick={activeModal.onAction}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs transition-all shadow cursor-pointer"
                >
                  {activeModal.actionLabel}
                </button>
              )}
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ROW 1: Macro Business Performance (4 cards) ───────────── */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Macro Cycle Performance ({metrics.settlement_cycle || 'Sep 01 – Sep 15, 2026'})
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Click cards for itemized breakdown</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Gross Sales */}
          <div
            onClick={() => handleCardClick('gross')}
            className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/20 hover:border-emerald-500/80 hover:bg-emerald-950/40 hover:shadow-lg hover:shadow-emerald-950/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 group-hover:text-emerald-300 transition-colors">Gross Sales</span>
              <div className="p-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/40 group-hover:border-emerald-500 transition-colors">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{metrics.gross_sales.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Completed orders</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                Inspect <ChevronRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* 2. Platform Fees */}
          <div
            onClick={() => handleCardClick('fees')}
            className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/20 hover:border-amber-500/80 hover:bg-amber-950/40 hover:shadow-lg hover:shadow-amber-950/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 group-hover:text-amber-300 transition-colors">Platform Fees</span>
              <div className="p-1.5 rounded-lg bg-amber-900/40 border border-amber-700/40 group-hover:border-amber-500 transition-colors">
                <Receipt className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{metrics.platform_fees.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Referral & FBA</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                Inspect <ChevronRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* 3. Customer Refunds */}
          <div
            onClick={() => handleCardClick('refunds')}
            className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/20 hover:border-rose-500/80 hover:bg-rose-950/40 hover:shadow-lg hover:shadow-rose-950/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 group-hover:text-rose-300 transition-colors">Customer Refunds</span>
              <div className="p-1.5 rounded-lg bg-rose-900/40 border border-rose-700/40 group-hover:border-rose-500 transition-colors">
                <Undo2 className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{metrics.refunds.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Surge included</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 text-[10px] font-semibold flex items-center gap-1">
                Inspect <ChevronRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* 4. Net Revenue (Accrued) */}
          <div
            onClick={() => handleCardClick('net')}
            className="p-4 rounded-xl border border-cyan-800/40 bg-cyan-950/20 hover:border-cyan-500/80 hover:bg-cyan-950/40 hover:shadow-lg hover:shadow-cyan-950/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 group-hover:text-cyan-300 transition-colors">Net Expected Accrual</span>
              <div className="p-1.5 rounded-lg bg-cyan-900/40 border border-cyan-700/40 group-hover:border-cyan-500 transition-colors">
                <Wallet className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{expectedSettlement.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Sales − Fees − Refunds</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 text-[10px] font-semibold flex items-center gap-1">
                Audit <ChevronRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Settlement Cycle Health & Anomalies (3 cards) ─────── */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Disbursement Reconciliation & Review
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Interactive cards</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 5. Actual Settlement Disbursed */}
          <div
            onClick={() => handleCardClick('actual')}
            className="p-4 rounded-xl border border-blue-800/40 bg-blue-950/20 hover:border-blue-500/80 hover:bg-blue-950/40 hover:shadow-lg hover:shadow-blue-950/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 group-hover:text-blue-300 transition-colors">Settlement Disbursed</span>
              <div className="p-1.5 rounded-lg bg-blue-900/40 border border-blue-700/40 group-hover:border-blue-500 transition-colors">
                <Landmark className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              ₹{actualSettlement.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Bank Cleared Record</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] font-semibold flex items-center gap-1">
                Inspect <ChevronRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* 6. Settlement Shortfall / Discrepancy */}
          <div
            onClick={() => handleCardClick('discrepancy')}
            className={`p-4 rounded-xl border hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group ${
              discrepancy > 0
                ? 'border-rose-600/70 bg-rose-950/30 hover:border-rose-400 hover:bg-rose-950/50 hover:shadow-lg hover:shadow-rose-950/40'
                : 'border-emerald-800/40 bg-emerald-950/20 hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-rose-200 transition-colors">Reconciliation Discrepancy</span>
              <div className="p-1.5 rounded-lg bg-rose-900/60 border border-rose-500/50 group-hover:border-rose-400 transition-colors">
                <AlertTriangle className="w-4 h-4 text-rose-300" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-rose-300 tracking-tight">
              −₹{discrepancy.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-rose-200 font-medium">Expected vs Actual</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-600 text-[10px] font-bold flex items-center gap-1">
                Root Cause <ChevronRight className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* 7. Active Anomalies Card */}
          <div
            onClick={() => handleCardClick('anomalies')}
            className="p-4 rounded-xl border border-amber-600/60 bg-amber-950/20 hover:border-amber-400 hover:bg-amber-950/40 hover:shadow-lg hover:shadow-amber-950/40 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-200 transition-colors">Active Anomalies</span>
              <div className="p-1.5 rounded-lg bg-amber-900/50 border border-amber-600/50 flex items-center gap-1 text-amber-300 group-hover:text-white transition-colors">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {metrics.active_anomalies_count} Events Detected
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Prioritized deviations</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-600 text-[10px] font-bold flex items-center gap-1">
                View All →
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
