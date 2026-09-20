import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { HowToUseModal } from './components/HowToUseModal';
import { DashboardView } from './views/DashboardView';
import { AnomaliesView } from './views/AnomaliesView';
import { GraphExplorer } from './components/GraphExplorer';
import { UploadView } from './components/UploadView';
import type { DashboardMetrics, AnomalyItem, InvestigateResponse, SubgraphResponse } from './types';
import { fetchDashboard, fetchAnomalies, fetchSubgraph, triggerInvestigation, loadDemoScenario } from './services/api';
import { InvestigationDrawer } from './components/InvestigationDrawer';
import { HelpCircle, Sparkles, ShieldAlert, Network, LayoutDashboard, FileSpreadsheet } from 'lucide-react';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [graphEntityId, setGraphEntityId] = useState<string | null>('SET-1029');
  const [subgraph, setSubgraph] = useState<SubgraphResponse | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(true);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Dashboard-level investigation state
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
    } finally {
      setIsLoadingGraph(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadAnomalies();
    loadSubgraph('SET-1029');
  }, [loadMetrics, loadAnomalies, loadSubgraph]);

  const handleViewGraph = (entityId: string) => {
    setGraphEntityId(entityId);
    setActiveTab('graph');
    loadSubgraph(entityId);
  };

  const handleDemoLoad = async (variant?: string) => {
    setIsDemoLoading(true);
    try {
      await loadDemoScenario(variant);
      await loadMetrics();
      await loadAnomalies();
      if (graphEntityId) {
        await loadSubgraph(graphEntityId);
      }
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

  const tabTitles: Record<Tab, { title: string; subtitle: string; icon: any }> = {
    dashboard: {
      title: 'Financial Health & Reconciliation Dashboard',
      subtitle: 'Real-time settlement cash flow, fee reconciliation and active discrepancy monitoring',
      icon: LayoutDashboard
    },
    anomalies: {
      title: 'Prioritized Anomaly Event Log',
      subtitle: 'Multi-signal deviations ranked by risk with Amazon Bedrock decision-support telemetry',
      icon: ShieldAlert
    },
    graph: {
      title: 'Temporal Financial Relationship Graph Explorer',
      subtitle: 'Multi-hop ego-network mapping entities, product return spikes, and transaction paths',
      icon: Network
    },
    upload: {
      title: 'Data Ingestion & Dataset Synthesis',
      subtitle: 'Ingest marketplace CSVs or arbitrary online market time-series for instant re-scoring',
      icon: FileSpreadsheet
    }
  };

  const currentTabInfo = tabTitles[activeTab];
  const CurrentIcon = currentTabInfo.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* ── Left Collapsible Sidebar ─────────────────────────────── */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as Tab)}
        anomaliesCount={metrics.active_anomalies_count}
        onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onLoadDemo={handleDemoLoad}
        isLoadingDemo={isDemoLoading}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* ── Main Content Area (With hardware-accelerated transition for sidebar) ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin-left] duration-200 ease-out will-change-[margin-left] ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Streamlined Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CurrentIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <h1 className="text-sm font-bold text-white truncate">
                  {currentTabInfo.title}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden md:block">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* How to use button */}
            <button
              onClick={() => setIsHowToUseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 hover:text-white text-xs font-semibold transition-all shadow cursor-pointer"
              title="Open step-by-step user guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">How to Use?</span>
            </button>

            {/* Merchant indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{metrics.seller_name || 'Apex Retailers (Amazon IN)'}</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
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

              {/* Quick entity switcher — all 7 anomaly entities */}
              <div className="flex gap-2 flex-wrap">
                {['SET-1029', 'SUP-031', 'PROD-088', 'TX-8291', 'PROD-042', 'FEE-9913', 'PROD-019'].map(eid => (
                  <button
                    key={eid}
                    onClick={() => { setGraphEntityId(eid); loadSubgraph(eid); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                      graphEntityId === eid
                        ? 'bg-cyan-900 border-cyan-600 text-cyan-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {eid}
                  </button>
                ))}
              </div>

              <div className="h-[620px] rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <GraphExplorer
                  subgraph={subgraph}
                  entityId={graphEntityId}
                  onClose={() => setActiveTab('dashboard')}
                />
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <UploadView
              onDemoLoaded={() => {
                loadMetrics();
                loadAnomalies();
                if (graphEntityId) loadSubgraph(graphEntityId);
              }}
              onNavigateToDashboard={() => setActiveTab('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Dashboard-level Investigation Drawer */}
      <InvestigationDrawer
        investigation={dashInvestigation}
        isLoading={dashInvestigating !== null}
        eventId={dashSelectedAnomaly?.event_id ?? null}
        onClose={() => {
          setDashSelectedAnomaly(null);
          setDashInvestigation(null);
          setDashInvestigating(null);
        }}
      />

      {/* "How to Use?" User Guide Modal */}
      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
        onNavigateTab={(tab: string) => setActiveTab(tab as Tab)}
        onLoadDemo={() => handleDemoLoad()}
      />
    </div>
  );
}
