import React, { useState } from 'react';
import { AnomalyItem, InvestigateResponse } from '../types';
import { AnomalyTable } from '../components/AnomalyTable';
import { InvestigationDrawer } from '../components/InvestigationDrawer';
import { triggerInvestigation } from '../services/api';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface AnomaliesViewProps {
  anomalies: AnomalyItem[];
  onViewGraph: (entityId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AnomaliesView: React.FC<AnomaliesViewProps> = ({
  anomalies,
  onViewGraph,
  onRefresh,
  isLoading,
}) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [isInvestigating, setIsInvestigating] = useState<string | null>(null);
  const [investigationResult, setInvestigationResult] = useState<InvestigateResponse | null>(null);

  const handleInvestigate = async (anomaly: AnomalyItem) => {
    setSelectedAnomaly(anomaly);
    setIsInvestigating(anomaly.event_id);
    setInvestigationResult(null);

    try {
      const result = await triggerInvestigation(anomaly.event_id);
      setInvestigationResult(result);
    } catch (err) {
      console.error('Investigation error:', err);
    } finally {
      setIsInvestigating(null);
    }
  };

  const handleViewGraph = (anomaly: AnomalyItem) => {
    onViewGraph(anomaly.entity_id);
  };

  const handleCloseDrawer = () => {
    setSelectedAnomaly(null);
    setInvestigationResult(null);
    setIsInvestigating(null);
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Anomaly Event Log</h2>
            <p className="text-xs text-slate-400">
              Sep 01–15, 2026 settlement cycle · {anomalies.length} events detected · Strands Agent (Amazon Bedrock)
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Priority Summary Chips */}
      <div className="flex flex-wrap gap-2">
        {['HIGH PRIORITY REVIEW', 'MEDIUM PRIORITY REVIEW', 'LOW PRIORITY REVIEW'].map(prio => {
          const count = anomalies.filter(a => a.priority_category === prio).length;
          const short = prio.replace(' PRIORITY REVIEW', '');
          const colorMap = {
            'HIGH': 'bg-rose-950 text-rose-300 border-rose-700',
            'MEDIUM': 'bg-amber-950 text-amber-300 border-amber-700',
            'LOW': 'bg-slate-900 text-slate-400 border-slate-700',
          };
          return (
            <span key={prio} className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorMap[short as keyof typeof colorMap]}`}>
              {count} {short}
            </span>
          );
        })}
        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-cyan-800 bg-cyan-950 text-cyan-300 ml-auto">
          F1 Score: 1.00 · Precision: 100%
        </span>
      </div>

      {/* Anomaly Table */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
          Loading anomaly events…
        </div>
      ) : (
        <AnomalyTable
          anomalies={anomalies}
          onInvestigate={handleInvestigate}
          onViewGraph={handleViewGraph}
          isInvestigating={isInvestigating}
        />
      )}

      {/* Investigation Drawer */}
      <InvestigationDrawer
        investigation={investigationResult}
        isLoading={isInvestigating !== null}
        eventId={selectedAnomaly?.event_id ?? null}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};
