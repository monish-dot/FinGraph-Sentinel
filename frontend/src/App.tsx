import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { AnomaliesView } from './views/AnomaliesView';
import { GraphExplorer } from './components/GraphExplorer';
import { UploadView } from './components/UploadView';
import type { DashboardMetrics, AnomalyItem, InvestigateResponse, SubgraphResponse } from './types';
import { fetchDashboard, fetchAnomalies, fetchSubgraph, triggerInvestigation, loadDemoScenario } from './services/api';
import { InvestigationDrawer } from './components/InvestigationDrawer';

type Tab = 'dashboard' | 'anomalies' | 'graph' | 'upload';

const DEFAULT_METRICS: DashboardMetrics = {
  gross_sales: 0,
  platform_fees: 0,
  refunds: 0,
  returns: 0,
  net_revenue: 0,
  settlement_amount: 0,
  active_anomalies_count: 0,
  seller_name: 'Apex Retailers (Amazon IN)',
  currency: 'INR',
  settlement_discrepancy_amount: 0,
  settlement_cycle: 'Sep 01 - Sep 15, 2026',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [graphEntityId, setGraphEntityId] = useState<string | null>('SET-1029');
  const [subgraph, setSubgraph] = useState<SubgraphResponse | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(true);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Dashboard-level investigation state (used in DashboardView CTA)
  const [dashInvestigation, setDashInvestigation] = useState<InvestigateResponse | null>(null);
  const [dashInvestigating, setDashInvestigating] = useState<string | null>(null);
  const [dashSelectedAnomaly, setDashSelectedAnomaly] = useState<AnomalyItem | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      const data = await fetchDashboard();
      setMetrics(data);
    } catch (e) {
      console.error('fetchDashboard failed:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  const loadAnomalies = useCallback(async () => {
    setIsLoadingAnomalies(true);
    try {
      const data = await fetchAnomalies();
      setAnomalies(data);
    } catch (e) {
      console.error('fetchAnomalies failed:', e);
    } finally {
      setIsLoadingAnomalies(false);
    }
  }, []);

  const loadSubgraph = useCallback(async (entityId: string) => {
    setIsLoadingGraph(true);
    try {
      const data = await fetchSubgraph(entityId);
      setSubgraph(data);
    } catch (e) {
      console.error('fetchSubgraph failed:', e);
      setSubgraph(null);
    } finally {
      setIsLoadingGraph(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadMetrics();
    loadAnomalies();
  }, [loadMetrics, loadAnomalies]);

  // Load graph when entity changes and graph tab is active
  useEffect(() => {
    if (graphEntityId && activeTab === 'graph') {
      loadSubgraph(graphEntityId);
    }
  }, [graphEntityId, activeTab, loadSubgraph]);

  const handleViewGraph = (entityId: string) => {
    setGraphEntityId(entityId);
    setActiveTab('graph');
    loadSubgraph(entityId);
  };

  const handleDemoLoad = async () => {
    setIsDemoLoading(true);
    try {
      await loadDemoScenario();
      await loadMetrics();
      await loadAnomalies();
    } catch (e) {
      console.error('Demo load error:', e);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleDashboardInvestigate = async (anomaly: AnomalyItem) => {
    setDashSelectedAnomaly(anomaly);
    setDashInvestigating(anomaly.event_id);
    setDashInvestigation(null);
    try {
      const result = await triggerInvestigation(anomaly.event_id);
      setDashInvestigation(result);
    } catch (err) {
      console.error('Investigation error:', err);
    } finally {
      setDashInvestigating(null);
    }
  };

  const handleRefresh = () => {
    loadMetrics();
    loadAnomalies();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as Tab)}
        onLoadDemo={handleDemoLoad}
        isLoadingDemo={isDemoLoading}
        anomaliesCount={metrics.active_anomalies_count}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            anomalies={anomalies}
            onInvestigateAnomaly={handleDashboardInvestigate}
            onViewGraph={handleViewGraph}
            onRefresh={handleRefresh}
            isLoading={isLoadingMetrics}
            onViewAnomalies={() => setActiveTab('anomalies')}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomaliesView
            anomalies={anomalies}
            onViewGraph={handleViewGraph}
            onRefresh={handleRefresh}
            isLoading={isLoadingAnomalies}
          />
        )}

        {activeTab === 'graph' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white text-sm">Temporal Financial Relationship Graph</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  NetworkX MultiDiGraph · Ego-network centered on <span className="font-mono text-cyan-400">{graphEntityId}</span>
                  {subgraph && ` · ${subgraph.nodes_count} nodes, ${subgraph.edges_count} edges`}
                </p>
              </div>
              {isLoadingGraph && (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  Building subgraph…
                </div>
              )}
            </div>

            {/* Quick entity switcher */}
            <div className="flex gap-2 flex-wrap">
              {['SET-1029', 'SUP-031', 'PROD-088', 'TX-8291'].map(eid => (
                <button
                  key={eid}
                  onClick={() => { setGraphEntityId(eid); loadSubgraph(eid); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    graphEntityId === eid
                      ? 'bg-cyan-900 border-cyan-600 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {eid}
                </button>
              ))}
            </div>

            <GraphExplorer
              subgraph={subgraph}
              entityId={graphEntityId}
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <UploadView onDemoLoaded={() => { loadMetrics(); loadAnomalies(); }} />
        )}
      </main>

      {/* Dashboard-level Investigation Drawer */}
      {(dashInvestigating !== null || dashInvestigation !== null) && (
        <InvestigationDrawer
          investigation={dashInvestigation}
          isLoading={dashInvestigating !== null}
          eventId={dashSelectedAnomaly?.event_id ?? null}
          onClose={() => {
            setDashInvestigation(null);
            setDashInvestigating(null);
            setDashSelectedAnomaly(null);
          }}
        />
      )}
    </div>
  );
}
