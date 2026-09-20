import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  FileSpreadsheet,
  HelpCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Bot
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  anomaliesCount: number;
  onOpenHowToUse: () => void;
  onLoadDemo: (variant?: string) => void;
  isLoadingDemo: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const DEMO_VARIANTS = ['Scenario A', 'Scenario B', 'Scenario C', 'Scenario D'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  anomaliesCount,
  onOpenHowToUse,
  onLoadDemo,
  isLoadingDemo,
  isCollapsed,
  setIsCollapsed
}) => {
  const [variantIdx, setVariantIdx] = React.useState(0);

  const handleNextDemo = () => {
    const next = (variantIdx + 1) % DEMO_VARIANTS.length;
    setVariantIdx(next);
    onLoadDemo(DEMO_VARIANTS[next]);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200'
    },
    {
      id: 'anomalies',
      label: 'Anomalies',
      icon: ShieldAlert,
      color: 'text-amber-400',
      badge: anomaliesCount,
      activeColor: 'bg-amber-950/70 border-amber-500/80 text-amber-200'
    },
    {
      id: 'graph',
      label: 'Temporal Graph',
      icon: Network,
      color: 'text-indigo-400',
      activeColor: 'bg-indigo-950/70 border-indigo-500/80 text-indigo-200'
    },
    {
      id: 'upload',
      label: 'Data Ingestion',
      icon: FileSpreadsheet,
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200'
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 flex flex-col transition-[width] duration-200 ease-out will-change-[width] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sleek Border Toggle Button (Permanently anchored at right edge, never jumps) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-5 z-50 flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 shadow-md shadow-black/60 transition-colors cursor-pointer"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        {!isCollapsed ? (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer text-left group overflow-hidden"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white shrink-0 group-hover:shadow-cyan-500/40 transition-shadow">
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0 pr-2">
              <span className="font-bold text-sm tracking-tight text-white block truncate group-hover:text-cyan-300 transition-colors">
                FinGraph Sentinel
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 inline-block">
                AWS Ship It 2026
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mx-auto p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white hover:scale-105 transition-transform cursor-pointer"
            title="FinGraph Sentinel — Dashboard"
          >
            <Network className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer group relative ${
                isActive
                  ? `${item.activeColor} shadow-lg shadow-black/40`
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : item.color}`} />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== undefined && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/60 shrink-0">
                  {item.badge}
                </span>
              )}
              {isCollapsed && item.badge !== undefined && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}

        <div className="pt-2 border-t border-slate-800/60 my-2" />

        {/* How to Use Guide Button */}
        <button
          onClick={onOpenHowToUse}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-xs font-semibold text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/30 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title={isCollapsed ? 'How to Use?' : undefined}
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-cyan-400" />
          {!isCollapsed && <span className="truncate flex-1 text-left">How to Use?</span>}
          {!isCollapsed && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 text-[9px] border border-cyan-800/50">
              Guide
            </span>
          )}
        </button>
      </div>

      {/* Bottom Information & Action Box */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-slate-800/80 space-y-2.5 bg-slate-900/30">
          {/* Quick Demo Scenario Trigger */}
          <button
            onClick={handleNextDemo}
            disabled={isLoadingDemo}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
            title="Cycle through randomized demo dataset scenarios"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
            <span>{isLoadingDemo ? 'Loading…' : 'Load Demo Scenario'}</span>
          </button>

          {/* Cloud Badges */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AWS Bedrock</span>
            </div>
            <span className="text-emerald-400 font-bold">Online</span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center pt-0.5">
            Apex Retailers · Sep 01–15, 2026
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-800/80 flex flex-col items-center gap-2">
          <button
            onClick={handleNextDemo}
            disabled={isLoadingDemo}
            className="p-2 rounded-lg bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/60 transition-colors cursor-pointer"
            title="Cycle Demo Scenario"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          </button>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="AWS Bedrock Online" />
        </div>
      )}
    </aside>
  );
};
