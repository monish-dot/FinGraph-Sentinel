import React from 'react';
import { InvestigateResponse } from '../types';
import { X, CheckCircle, Clock, AlertCircle, Bot, Loader2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InvestigationDrawerProps {
  investigation: InvestigateResponse | null;
  isLoading: boolean;
  eventId: string | null;
  onClose: () => void;
}

const STEP_ICON_MAP: Record<string, string> = {
  get_settlement: '📒',
  get_financial_summary: '📊',
  get_refund_history: '↩️',
  get_product_history: '📦',
  calculate_expected_settlement: '🧮',
  get_supplier_history: '🏭',
  get_transaction: '💳',
  get_anomaly_evidence: '🔍',
  get_fee_summary: '🏷️'
};

export const InvestigationDrawer: React.FC<InvestigationDrawerProps> = ({
  investigation,
  isLoading,
  eventId,
  onClose
}) => {
  const isOpen = isLoading || investigation !== null;

  if (!isOpen) return null;

  const steps = investigation?.tool_execution_steps ?? [];
  const summary = investigation?.structured_summary;
  const evidence = investigation?.evidence;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-900/40 border border-cyan-700/40">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-sm">
                  AI Investigation Report
                </h2>
                <p className="text-xs text-slate-400">
                  {investigation?.model_provider ?? 'Strands Agent (Amazon Bedrock)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subject banner */}
          {eventId && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-800/50">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-mono font-semibold text-rose-200 text-xs">{eventId}</span>
                {summary && (
                  <div className="text-[10px] text-rose-300/80 mt-0.5">
                    Expected ₹{summary.expected_amount.toLocaleString('en-IN')} vs Actual ₹{summary.actual_amount.toLocaleString('en-IN')} — Gap:{' '}
                    <strong className="text-rose-300">₹{summary.discrepancy_amount.toLocaleString('en-IN')}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Tool Execution Trace */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Verified Tool Execution Trace
            </h3>

            {isLoading && steps.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-slate-800 rounded w-3/4" />
                      <div className="h-2 bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const emoji = STEP_ICON_MAP[step.tool_name] ?? '🔧';
                  const isLast = idx === steps.length - 1;
                  return (
                    <div key={idx} className="relative">
                      {!isLast && (
                        <div className="absolute left-[18px] top-9 bottom-0 w-px bg-slate-800 -z-0" />
                      )}
                      <div className={`relative z-10 flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        step.status === 'COMPLETED'
                          ? 'border-slate-700/60 bg-slate-900/40'
                          : 'border-slate-800 bg-slate-900/20'
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-sm shrink-0">
                          {step.status === 'COMPLETED'
                            ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                            : <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-100 text-xs">{step.label}</span>
                            <span className="font-mono text-[9px] text-slate-600 shrink-0">{step.duration_ms}ms</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.output_summary}</p>
                          <span className="font-mono text-[9px] text-cyan-600 mt-0.5 block">{emoji} {step.tool_name}()</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-cyan-800/40 bg-cyan-950/20">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs text-cyan-300">Synthesizing grounded explanation with Amazon Bedrock…</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evidence Signals */}
          {evidence && evidence.signals && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Verified Signals
              </h3>
              <div className="space-y-1.5">
                {evidence.signals.map((sig, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <ChevronRight className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                    {sig}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Investigation Report */}
          {investigation?.report_markdown && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Grounded Investigation Report
              </h3>
              <div className="prose prose-invert prose-sm max-w-none rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-slate-200 leading-relaxed
                prose-h3:text-cyan-300 prose-h3:text-sm prose-h3:font-semibold prose-h3:border-b prose-h3:border-slate-800 prose-h3:pb-1
                prose-strong:text-white prose-li:text-slate-300 prose-p:text-slate-300 prose-p:text-xs prose-li:text-xs">
                <ReactMarkdown>{investigation.report_markdown}</ReactMarkdown>
              </div>

              {/* Non-accusatory disclaimer */}
              <div className="mt-3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/50 text-[10px] text-slate-500 leading-relaxed">
                ⚠️ <strong className="text-slate-400">Decision-Support Notice:</strong> This investigation report highlights factual financial anomalies for human seller review. It does <em>not</em> declare fraud, criminal activity, or assign blame. All financial decisions remain at the sole discretion of the seller.
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {summary && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
              <h3 className="text-xs font-semibold text-cyan-300 mb-2">Recommended Action</h3>
              <p className="text-xs text-slate-300">{summary.recommended_action}</p>
            </div>
          )}

          {/* Duration stats */}
          {investigation && (
            <div className="text-center text-[10px] text-slate-600 font-mono">
              Total investigation duration: {investigation.total_duration_seconds.toFixed(2)}s | Tools used: {steps.length}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {investigation && (
            <div className="flex gap-2">
              <button className="px-4 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">
                Mark as Reviewed
              </button>
              <button className="px-4 py-2 text-xs rounded-lg bg-gradient-to-r from-cyan-700 to-blue-700 text-white font-medium hover:from-cyan-600 hover:to-blue-600 transition-all">
                Export Audit Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
