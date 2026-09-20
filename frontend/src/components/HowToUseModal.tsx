import React from 'react';
import {
  X,
  HelpCircle,
  ShieldAlert,
  Network,
  UploadCloud,
  FileCheck2,
  Bot,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onLoadDemo: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onLoadDemo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                How to Use FinGraph Sentinel
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Quick Guide
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Decision-support financial relationship intelligence for marketplace sellers & analysts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body (Hardware-accelerated smooth scrolling) */}
        <div className="flex-1 overflow-y-auto smooth-scroll scroll-smooth overscroll-contain p-6 space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* Core Concept Banner */}
          <div className="p-4 rounded-xl border border-cyan-700/50 bg-cyan-950/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-cyan-200 text-sm">What does FinGraph Sentinel do?</h3>
              <p className="text-slate-300 mt-1">
                E-commerce sellers frequently suffer unexplained payout shortfalls due to late refund debits, clustered returns, or unexpected fee deductions.
                FinGraph Sentinel connects your marketplace orders, fees, refunds, and bank payouts into a <strong>temporal relationship graph</strong>, then uses a grounded <strong>Strands Agent (Amazon Bedrock)</strong> to explain discrepancies and provide review actions.
              </p>
            </div>
          </div>

          {/* 4-Step Interactive Walkthrough */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono font-bold text-[10px] border border-cyan-800">
                  STEP 1
                </span>
                <TrendingDown className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="font-semibold text-white text-sm">Review Financial Dashboard</h4>
              <p className="text-slate-400 text-[11px]">
                Check top-level <strong>Gross Sales, Platform Fees, and Discrepancies</strong>.
                Click on any KPI card to see itemized mathematical breakdowns.
              </p>
              <button
                onClick={() => { onClose(); onNavigateTab('dashboard'); }}
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] pt-1"
              >
                Go to Dashboard <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono font-bold text-[10px] border border-rose-800">
                  STEP 2
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <h4 className="font-semibold text-white text-sm">Investigate Anomalies</h4>
              <p className="text-slate-400 text-[11px]">
                In the <strong>Anomalies</strong> tab, discover prioritized deviations.
                Click <strong>"Investigate"</strong> to see verified Bedrock execution traces and download formatted PDF/JSON audit logs.
              </p>
              <button
                onClick={() => { onClose(); onNavigateTab('anomalies'); }}
                className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold text-[11px] pt-1"
              >
                Inspect Anomalies <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono font-bold text-[10px] border border-indigo-800">
                  STEP 3
                </span>
                <Network className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="font-semibold text-white text-sm">Inspect Relationship Graph</h4>
              <p className="text-slate-400 text-[11px]">
                Use the <strong>Temporal Graph Explorer</strong> to visually inspect multi-hop paths connecting Sellers, Products, Orders, Customers, and Payout Accounts.
                Search for any node using the quick search bar.
              </p>
              <button
                onClick={() => { onClose(); onNavigateTab('graph'); }}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] pt-1"
              >
                Open Graph Explorer <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-800">
                  STEP 4
                </span>
                <UploadCloud className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-white text-sm">Upload Custom or Market Datasets</h4>
              <p className="text-slate-400 text-[11px]">
                Drop standard seller CSVs or <strong>any online dataset</strong> (Yahoo Finance stock time-series, retail logs, crypto).
                The engine automatically detects columns, recalculates metrics, and reveals anomalies.
              </p>
              <button
                onClick={() => { onClose(); onNavigateTab('upload'); }}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] pt-1"
              >
                Upload Data <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Decision Support Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-amber-300">Decision-Support Guardrail:</strong> FinGraph Sentinel provides transparent verification metrics and audit reports for human seller review. It operates in strict read-only mode and never declares criminal allegations or alters bank balances.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onLoadDemo();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Load Sample Scenario
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            Got It, Let's Start →
          </button>
        </div>
      </div>
    </div>
  );
};
