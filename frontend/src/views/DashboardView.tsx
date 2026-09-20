import React from 'react';
import type { DashboardMetrics, AnomalyItem } from '../types';
import { KPICards } from '../components/KPICards';
import { DashboardCharts } from '../components/DashboardCharts';
import {
  AlertTriangle, TrendingDown, ArrowRight, RefreshCw,
  Clock, Bot, Zap
} from 'lucide-react';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  anomalies: AnomalyItem[];
  onInvestigateAnomaly: (anomaly: AnomalyItem) => void;
  onViewGraph: (entityId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onViewAnomalies?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  anomalies,
  onInvestigateAnomaly,
  onViewGraph,
  onRefresh,
  isLoading,
  onViewAnomalies,
}) => {
  const flagship = anomalies.find(a => a.event_id === 'SET-1029');
  const hasDiscrepancy = metrics.settlement_discrepancy_amount > 0;
  const highPriority = anomalies.filter(a => a.priority_category === 'HIGH PRIORITY REVIEW');
  const actualSettlement = metrics.settlement_amount;
  const expectedSettlement = metrics.settlement_amount + metrics.settlement_discrepancy_amount;

  return (
    <div className="space-y-5">
      {/* ── Attention Banner ───────────────────────────────────────── */}
      {hasDiscrepancy && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-xl border border-rose-700/60 bg-rose-950/30 backdrop-blur-sm">
          <div className="p-2 rounded-lg bg-rose-900/50 border border-rose-700/50 shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-200 text-sm">
              Settlement Discrepancy Detected — Sep 01–15 Cycle
            </p>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Actual payout ₹{actualSettlement.toLocaleString('en-IN')} is{' '}
              <strong className="text-rose-200">₹{metrics.settlement_discrepancy_amount.toLocaleString('en-IN')} below</strong> the expected ₹{expectedSettlement.toLocaleString('en-IN')}.
              {' '}{highPriority.length} anomaly event{highPriority.length !== 1 ? 's' : ''} require immediate review.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-rose-900/50 text-rose-400 hover:text-rose-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <KPICards metrics={metrics} onViewAnomalies={onViewAnomalies || (() => {})} />

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <DashboardCharts metrics={metrics} />

      {/* ── Flagship Spotlight Card ────────────────────────────────── */}
      {flagship && (
        <div className="rounded-xl border border-amber-700/40 bg-gradient-to-br from-amber-950/30 to-slate-900/80 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-amber-200 text-sm">Investigation Spotlight</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-900 text-amber-300 border border-amber-700">
              HIGHEST PRIORITY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">Expected Settlement</div>
              <div className="font-mono font-bold text-green-300 text-lg">
                ₹{flagship.expected_amount?.toLocaleString('en-IN') ?? '94,500'}
              </div>
              <div className="text-[10px] text-slate-500">Computed via tool</div>
            </div>
            <div className="rounded-lg bg-slate-900/60 border border-rose-800/40 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">Actual Payout</div>
              <div className="font-mono font-bold text-rose-300 text-lg">
                ₹{flagship.actual_amount?.toLocaleString('en-IN') ?? '91,200'}
              </div>
              <div className="text-[10px] text-slate-500">Verified from ledger</div>
            </div>
            <div className="rounded-lg bg-rose-950/50 border border-rose-700/60 p-3 text-center">
              <div className="text-xs text-rose-300 mb-1">Cash Flow Gap</div>
              <div className="font-mono font-bold text-rose-200 text-lg">
                −₹{flagship.discrepancy_amount?.toLocaleString('en-IN') ?? '3,300'}
              </div>
              <div className="text-[10px] text-rose-400">P17 refund spike 2.7×</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(flagship.signals ?? []).map((sig, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                {sig}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewGraph(flagship.entity_id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-700 bg-cyan-950/40 text-cyan-300 text-xs font-medium hover:bg-cyan-900/40 transition-all"
            >
              View Relationship Graph <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onInvestigateAnomaly(flagship)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white text-xs font-semibold transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              Run AI Investigation
            </button>
          </div>
        </div>
      )}

      {/* ── All Anomalies Summary ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            All Detected Anomalies
          </h3>
          <span className="text-xs text-slate-500">{anomalies.length} events across current settlement cycle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {anomalies.slice(0, 6).map(anomaly => (
            <div
              key={anomaly.anomaly_id}
              className={`rounded-xl border p-3.5 cursor-pointer transition-all hover:border-slate-600 ${
                anomaly.event_id === 'SET-1029'
                  ? 'border-rose-800/50 bg-rose-950/20'
                  : 'border-slate-800 bg-slate-900/30'
              }`}
              onClick={() => onInvestigateAnomaly(anomaly)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-white">{anomaly.event_id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  anomaly.priority_category === 'HIGH PRIORITY REVIEW'
                    ? 'text-rose-300 bg-rose-950 border border-rose-700'
                    : anomaly.priority_category === 'MEDIUM PRIORITY REVIEW'
                    ? 'text-amber-300 bg-amber-950 border border-amber-700'
                    : 'text-slate-400 bg-slate-900 border border-slate-700'
                }`}>
                  {anomaly.priority_score.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{anomaly.title}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  anomaly.priority_category === 'HIGH PRIORITY REVIEW' ? 'bg-rose-400'
                  : anomaly.priority_category === 'MEDIUM PRIORITY REVIEW' ? 'bg-amber-400'
                  : 'bg-slate-500'
                }`} />
                <span className="text-[10px] text-slate-500">{anomaly.entity_type} · {anomaly.entity_id}</span>
                <span className="ml-auto font-mono text-xs text-rose-400 font-semibold">
                  −₹{anomaly.discrepancy_amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {anomaly.priority_category === 'HIGH PRIORITY REVIEW'
                  ? <AlertTriangle className="w-3 h-3 text-rose-400" />
                  : <Clock className="w-3 h-3 text-amber-400" />}
                <span className="text-[10px] text-slate-500">
                  {anomaly.priority_category === 'HIGH PRIORITY REVIEW' ? 'Immediate review recommended' : 'Review within 48 hours'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
