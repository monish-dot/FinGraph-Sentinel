import React from 'react';
import { AnomalyItem } from '../types';
import {
  ShieldAlert, Search, Filter, AlertCircle, Zap,
  RefreshCw, TrendingDown, Users, Package, Truck, DollarSign
} from 'lucide-react';

interface AnomalyTableProps {
  anomalies: AnomalyItem[];
  onInvestigate: (anomaly: AnomalyItem) => void;
  onViewGraph: (anomaly: AnomalyItem) => void;
  isInvestigating: string | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SETTLEMENT_MISMATCH: { label: 'Settlement Mismatch', color: 'bg-rose-950 text-rose-300 border-rose-700', icon: DollarSign },
  UNUSUAL_TRANSACTION_AMOUNT: { label: 'Unusual Amount', color: 'bg-orange-950 text-orange-300 border-orange-700', icon: AlertCircle },
  NEW_SUPPLIER_RELATIONSHIP: { label: 'New Supplier', color: 'bg-yellow-950 text-yellow-300 border-yellow-700', icon: Users },
  TRANSACTION_BURST: { label: 'Tx Burst', color: 'bg-purple-950 text-purple-300 border-purple-700', icon: Zap },
  REFUND_SPIKE: { label: 'Refund Spike', color: 'bg-pink-950 text-pink-300 border-pink-700', icon: TrendingDown },
  DUPLICATE_TRANSACTION: { label: 'Duplicate Fee', color: 'bg-red-950 text-red-300 border-red-700', icon: RefreshCw },
  RETURN_CLUSTER: { label: 'Return Cluster', color: 'bg-indigo-950 text-indigo-300 border-indigo-700', icon: Truck }
};

const PRIORITY_CONFIG = {
  'HIGH PRIORITY REVIEW': { color: 'bg-rose-950 text-rose-200 border border-rose-600', dot: 'bg-rose-400' },
  'MEDIUM PRIORITY REVIEW': { color: 'bg-amber-950 text-amber-200 border border-amber-600', dot: 'bg-amber-400' },
  'LOW PRIORITY REVIEW': { color: 'bg-slate-900 text-slate-300 border border-slate-600', dot: 'bg-slate-400' }
};

export const AnomalyTable: React.FC<AnomalyTableProps> = ({
  anomalies,
  onInvestigate,
  onViewGraph,
  isInvestigating
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('ALL');
  const [filterPriority, setFilterPriority] = React.useState('ALL');

  const filtered = anomalies.filter(a => {
    const matchSearch = searchQuery === '' ||
      a.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'ALL' || a.category === filterCategory;
    const matchPri = filterPriority === 'ALL' || a.priority_category === filterPriority;
    return matchSearch && matchCat && matchPri;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, entity, or title…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs w-full placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Categories</option>
          {Object.keys(CATEGORY_CONFIG).map(k => (
            <option key={k} value={k}>{CATEGORY_CONFIG[k].label}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH PRIORITY REVIEW">High Priority</option>
          <option value="MEDIUM PRIORITY REVIEW">Medium Priority</option>
          <option value="LOW PRIORITY REVIEW">Low Priority</option>
        </select>

        <span className="text-slate-500 text-xs font-mono ml-auto">
          {filtered.length} of {anomalies.length} events
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800">
              <th className="text-left px-4 py-3 font-semibold text-slate-400 tracking-wide uppercase text-[10px]">Anomaly ID & Category</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 tracking-wide uppercase text-[10px]">Entity</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 tracking-wide uppercase text-[10px]">Priority Score</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-400 tracking-wide uppercase text-[10px]">Impact</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-400 tracking-wide uppercase text-[10px]">Key Signals</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-400 tracking-wide uppercase text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((anomaly, idx) => {
              const catConfig = CATEGORY_CONFIG[anomaly.category] || { label: anomaly.category, color: 'bg-slate-900 text-slate-300 border-slate-700', icon: AlertCircle };
              const priConfig = PRIORITY_CONFIG[anomaly.priority_category];
              const Icon = catConfig.icon;
              const isThis = isInvestigating === anomaly.event_id;

              return (
                <tr
                  key={anomaly.anomaly_id}
                  className={`border-b border-slate-800/60 transition-colors hover:bg-slate-900/50 ${
                    isThis ? 'bg-cyan-950/20 border-l-2 border-l-cyan-500' : ''
                  } ${anomaly.event_id === 'SET-1029' ? 'bg-rose-950/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-semibold text-white text-xs">{anomaly.event_id}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${catConfig.color} w-fit`}>
                        <Icon className="w-2.5 h-2.5" />
                        {catConfig.label}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-slate-200">{anomaly.entity_id}</span>
                      <span className="text-slate-500 text-[10px]">{anomaly.entity_type}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${anomaly.priority_score * 100}%`,
                              background: anomaly.priority_score >= 0.7 ? '#EF4444' : anomaly.priority_score >= 0.45 ? '#F59E0B' : '#6B7280'
                            }}
                          />
                        </div>
                        <span className="font-mono text-white font-bold">{anomaly.priority_score.toFixed(2)}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold w-fit ${priConfig.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priConfig.dot}`}></span>
                        {anomaly.priority_category.replace(' PRIORITY REVIEW', '')}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-rose-300 text-sm">
                      −₹{anomaly.discrepancy_amount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td className="px-4 py-3 max-w-[240px]">
                    <div className="flex flex-wrap gap-1">
                      {anomaly.signals.slice(0, 2).map((sig, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 text-[9px] border border-slate-700 truncate max-w-[130px]" title={sig}>
                          {sig.slice(0, 28)}{sig.length > 28 ? '…' : ''}
                        </span>
                      ))}
                      {anomaly.signals.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 text-[9px]">
                          +{anomaly.signals.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewGraph(anomaly)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-600 transition-all"
                      >
                        View Graph
                      </button>
                      <button
                        onClick={() => onInvestigate(anomaly)}
                        disabled={!!isInvestigating}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                          isThis
                            ? 'bg-cyan-700 border-cyan-500 text-white'
                            : 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 border-cyan-600 text-white'
                        } disabled:opacity-50`}
                      >
                        {isThis ? 'Investigating…' : 'Investigate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No anomalies match your current filters.
          </div>
        )}
      </div>
    </div>
  );
};
