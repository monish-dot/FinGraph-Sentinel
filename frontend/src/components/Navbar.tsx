import React from 'react';
import { ShieldAlert, Network, RefreshCw, CloudCheck, Sparkles, Database, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  anomaliesCount: number;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  anomaliesCount,
  onLoadDemo,
  isLoadingDemo
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Top tier brand bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">FinGraph Sentinel</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                AWS Ship It 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              “See the relationship. Understand the anomaly. Decide what to review.”
            </p>
          </div>
        </div>

        {/* Status badges & Demo Action */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Cloud indicators */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-slate-400">AWS Bedrock</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-medium">Online</span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="font-mono text-slate-400">Strands Agent</span>
          </div>

          {/* Load Demo Scenario Button */}
          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-60"
            title="Reloads deterministic 10,000 transaction dataset with Settlement SET-1029 anomaly"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
            <span>{isLoadingDemo ? 'Loading Demo...' : 'Load Demo Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Lower Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between border-t border-slate-900 text-xs">
        <nav className="flex space-x-1 sm:space-x-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'dashboard'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Financial Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'anomalies'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Anomalies</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-rose-950 text-rose-300 font-bold border border-rose-800/60">
              {anomaliesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'graph'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Temporal Graph Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Data Ingestion</span>
          </button>
        </nav>

        {/* Active merchant profile & cycle */}
        <div className="hidden lg:flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
          <span>Merchant: <strong className="text-slate-200">Apex Retailers (Amazon IN)</strong></span>
          <span className="text-slate-700">•</span>
          <span>Cycle: <strong className="text-cyan-300">Sep 01 – Sep 15, 2026</strong></span>
        </div>
      </div>
    </header>
  );
};
