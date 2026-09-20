import React from 'react';
import { TrendingUp, Receipt, Undo2, RotateCcw, Wallet, Landmark, AlertTriangle } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface KPICardsProps {
  metrics: DashboardMetrics;
  onViewAnomalies: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics, onViewAnomalies }) => {
  const cards = [
    {
      title: 'Gross Sales',
      amount: `₹${metrics.gross_sales.toLocaleString('en-IN')}`,
      subtitle: '8,516 completed orders',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/40',
      badge: '+12.4% vs last cycle'
    },
    {
      title: 'Platform Fees',
      amount: `₹${metrics.platform_fees.toLocaleString('en-IN')}`,
      subtitle: 'Referral & FBA deductions',
      icon: Receipt,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/40',
      badge: '15.0% of GMV'
    },
    {
      title: 'Refunds',
      amount: `₹${metrics.refunds.toLocaleString('en-IN')}`,
      subtitle: 'Post-purchase deductions',
      icon: Undo2,
      color: 'text-rose-400',
      bg: 'bg-rose-950/40 border-rose-800/40',
      badge: '3.8% refund rate'
    },
    {
      title: 'Returns',
      amount: `₹${metrics.returns.toLocaleString('en-IN')}`,
      subtitle: '157 units returned',
      icon: RotateCcw,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-800/40',
      badge: '1.8% return rate'
    },
    {
      title: 'Net Revenue',
      amount: `₹${metrics.net_revenue.toLocaleString('en-IN')}`,
      subtitle: 'Realized merchant margin',
      icon: Wallet,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40 border-cyan-800/40',
      badge: 'Accrued before payout'
    },
    {
      title: 'Settlement Disbursed',
      amount: `₹${metrics.settlement_amount.toLocaleString('en-IN')}`,
      subtitle: 'Actual bank disbursement',
      icon: Landmark,
      color: 'text-blue-400',
      bg: metrics.settlement_discrepancy_amount > 0 ? 'bg-amber-950/40 border-amber-500/60' : 'bg-blue-950/40 border-blue-800/40',
      badge: metrics.settlement_discrepancy_amount > 0 ? `-₹${metrics.settlement_discrepancy_amount.toLocaleString('en-IN')} Discrepancy` : 'Fully Reconciled',
      isDiscrepancy: metrics.settlement_discrepancy_amount > 0
    },
    {
      title: 'Active Anomalies',
      amount: `${metrics.active_anomalies_count} Events`,
      subtitle: 'Require seller review',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-950/50 border-rose-500/60',
      badge: '7 flagged events',
      clickable: true
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 my-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            onClick={c.clickable ? onViewAnomalies : undefined}
            className={`p-3.5 rounded-xl border ${c.bg} transition-all duration-200 ${
              c.clickable ? 'cursor-pointer hover:border-rose-400 hover:scale-[1.02]' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400 truncate">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>

            <div className="text-base font-bold font-mono text-white tracking-tight truncate">
              {c.amount}
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 truncate">{c.subtitle}</span>
            </div>

            {c.badge && (
              <div className="mt-2">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide ${
                    c.isDiscrepancy
                      ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  {c.badge}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
