import React, { useState } from 'react';
import { InvestigateResponse } from '../types';
import {
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Bot,
  Loader2,
  ChevronRight,
  Download,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  FileCode2,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

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

function getReviewedEvents(): Record<string, { reviewedAt: string }> {
  try {
    return JSON.parse(localStorage.getItem('fingraph_reviewed_events') || '{}');
  } catch {
    return {};
  }
}

function markEventReviewed(eventId: string) {
  const existing = getReviewedEvents();
  existing[eventId] = { reviewedAt: new Date().toISOString() };
  localStorage.setItem('fingraph_reviewed_events', JSON.stringify(existing));
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/₹/g, 'INR ')
    .replace(/—/g, ' - ')
    .replace(/–/g, ' - ')
    .replace(/•/g, '* ')
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractMarkdownSection(md: string, heading: string): string {
  if (!md) return '';
  const regex = new RegExp(`###?\\s*${heading}:?\\s*([\\s\\S]*?)(?=###?|$)`, 'i');
  const match = md.match(regex);
  return match ? match[1].trim() : '';
}

// ── 1. PDF Export with Colors, Badges & Professional Formatting ──
function exportAuditLogAsPdf(investigation: InvestigateResponse, eventId: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Dark slate header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Cyan brand accent line
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 29, pageWidth, 1.2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FinGraph Sentinel - Financial Investigation Audit Log', 14, 13);

  // Subtitle
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Amazon Bedrock & Strands Agent Decision-Support Telemetry', 14, 21);

  const dateStr = new Date().toLocaleString();
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Exported: ${cleanText(dateStr)}`, pageWidth - 14, 21, { align: 'right' });

  let y = 36;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(`Investigation Target: ${cleanText(eventId)}`, 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Provider: ${cleanText(investigation.model_provider || 'Strands Agent (Amazon Bedrock)')}`, 18, y + 12);

  const durationStr = `${investigation.total_duration_seconds.toFixed(2)}s`;
  const toolCount = investigation.tool_execution_steps.length;
  doc.text(`Execution Latency: ${durationStr} | Verified Tools: ${toolCount}`, pageWidth - 18, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('Integrity: 100% Deterministic Arithmetic', pageWidth - 18, y + 12, { align: 'right' });

  y += 21;

  // Financial Metrics 3-Card Summary (Contextually labeled by event type)
  const summary = investigation.structured_summary;
  if (summary) {
    const boxW = (pageWidth - 28 - 8) / 3;

    let label1 = 'EXPECTED SETTLEMENT';
    let label2 = 'ACTUAL DISBURSEMENT';
    let label3 = 'DISCREPANCY SHORTFALL';

    if (eventId.includes('TX') || eventId.includes('8291')) {
      label1 = 'EXPECTED ORDER VALUE';
      label2 = 'RECORDED TRANSACTION';
      label3 = 'OUTLIER DEVIATION';
    } else if (eventId.includes('SUP') || eventId.includes('031')) {
      label1 = 'HISTORICAL BASELINE';
      label2 = 'TOTAL DISBURSED';
      label3 = 'UNVERIFIED OUTFLOW';
    } else if (eventId.includes('FEE') || eventId.includes('9913')) {
      label1 = 'CONTRACTED COMMISSION';
      label2 = 'CHARGED FEE';
      label3 = 'DUPLICATE OVERCHARGE';
    } else if (eventId.includes('PROD')) {
      label1 = 'CATEGORY BASELINE';
      label2 = 'RECORDED VALUE';
      label3 = 'ABNORMAL VARIANCE';
    }

    // Box 1: Expected / Baseline (Emerald)
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, y, boxW, 16, 2, 2, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text(label1, 14 + boxW / 2, y + 4.8, { align: 'center' });
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text(`INR ${Math.abs(summary.expected_amount).toLocaleString('en-IN')}`, 14 + boxW / 2, y + 12, { align: 'center' });

    // Box 2: Actual / Recorded (Blue)
    const x2 = 14 + boxW + 4;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(x2, y, boxW, 16, 2, 2, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(37, 99, 235);
    doc.text(label2, x2 + boxW / 2, y + 4.8, { align: 'center' });
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(`INR ${Math.abs(summary.actual_amount).toLocaleString('en-IN')}`, x2 + boxW / 2, y + 12, { align: 'center' });

    // Box 3: Discrepancy / Variance (Rose)
    const x3 = x2 + boxW + 4;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(x3, y, boxW, 16, 2, 2, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(225, 29, 72);
    doc.text(label3, x3 + boxW / 2, y + 4.8, { align: 'center' });
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(159, 18, 57);
    const sign = summary.discrepancy_amount >= 0 ? '-' : '+';
    doc.text(`${sign} INR ${Math.abs(summary.discrepancy_amount).toLocaleString('en-IN')}`, x3 + boxW / 2, y + 12, { align: 'center' });

    y += 21;
  }

  // Executive Finding Card (Full text, wrapped, never clipped)
  const findingText = extractMarkdownSection(investigation.report_markdown, 'Finding') || summary?.primary_driver || '';
  if (findingText) {
    const cleanFinding = cleanText(findingText);
    const findingLines = doc.splitTextToSize(cleanFinding, pageWidth - 36);
    const cardH = 7.5 + (findingLines.length * 3.8);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(218, 226, 237);
    doc.roundedRect(14, y, pageWidth - 28, cardH, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('EXECUTIVE FINDING & BEHAVIORAL DEVIATION', 18, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(findingLines, 18, y + 9);

    y += cardH + 4;
  }

  // Section: Tool Execution Trace
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFIED DETERMINISTIC TOOL EXECUTION TRACE', 14, y);
  y += 3.5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 5.5, 'F');
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('STEP / PYTHON TOOL', 17, y + 3.8);
  doc.text('DETERMINISTIC OUTPUT & VERIFIED LEDGER EVIDENCE', 68, y + 3.8);
  doc.text('LATENCY', pageWidth - 18, y + 3.8, { align: 'right' });
  y += 6.5;

  investigation.tool_execution_steps.slice(0, 6).forEach((step, idx) => {
    const rowH = 6.8;
    doc.setFillColor(idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255, idx % 2 === 0 ? 254 : 255);
    doc.setDrawColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, rowH, 'F');

    // Col 1: Step & Tool Name (x=17)
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`[${idx + 1}] ${cleanText(step.tool_name)}()`, 17, y + 4.5);

    // Col 2: Summary Text (x=68, width 102)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    const cleanedSummary = cleanText(step.output_summary);
    const summaryLines = doc.splitTextToSize(cleanedSummary, 104);
    doc.text(summaryLines[0] || '', 68, y + 4.5);

    // Col 3: Duration (x=pageWidth-18, align: right)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`${step.duration_ms}ms`, pageWidth - 18, y + 4.5, { align: 'right' });

    y += rowH;
  });

  y += 3.5;

  // Section: Evidence Signals
  if (investigation.evidence?.signals?.length) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('VERIFIED EVIDENCE SIGNALS', 14, y);
    y += 3.5;

    investigation.evidence.signals.slice(0, 3).forEach(sig => {
      const cleanedSig = cleanText(sig);
      const sigLines = doc.splitTextToSize(`* ${cleanedSig}`, pageWidth - 36);
      const pillH = Math.max(5.5, sigLines.length * 3.5 + 2);

      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(14, y, pageWidth - 28, pillH, 1, 1, 'FD');

      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14);
      doc.text(sigLines, 18, y + 3.8);
      y += pillH + 1.8;
    });
  }

  y += 1.5;

  // Recommended Action for Seller (Full checklist)
  const actionText = extractMarkdownSection(investigation.report_markdown, 'Recommended Review') || summary?.recommended_action || '';
  if (actionText && y < pageHeight - 40) {
    const cleanAction = cleanText(actionText);
    const actionLines = doc.splitTextToSize(cleanAction, pageWidth - 36);
    const boxH = Math.max(12, 7.5 + (actionLines.length * 3.6));

    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(14, y, pageWidth - 28, boxH, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 105, 161);
    doc.text('ACTIONABLE RECOMMENDED REVIEW (Decision-Support)', 18, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(12, 74, 110);
    doc.text(actionLines, 18, y + 9);

    y += boxH + 3.5;
  }

  // Footer Disclaimer
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Decision-Support Notice: Highlights verified factual anomalies for seller review. Does not alter ledgers or execute transfers.', pageWidth / 2, pageHeight - 7, { align: 'center' });
  doc.text('FinGraph Sentinel | AWS Ship It Hackathon 2026 | Powered by Amazon Bedrock & Strands Agent Framework', pageWidth / 2, pageHeight - 3.5, { align: 'center' });

  doc.save(`audit-report-${cleanText(eventId)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}


// ── 2. CSV Export ──
function exportAuditLogAsCsv(investigation: InvestigateResponse, eventId: string) {
  const headers = ['Event_ID', 'Step_Number', 'Tool_Name', 'Status', 'Duration_MS', 'Output_Summary'];
  const rows = investigation.tool_execution_steps.map((step, idx) => [
    eventId,
    idx + 1,
    `"${step.tool_name}"`,
    step.status,
    step.duration_ms,
    `"${(step.output_summary || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-data-${eventId}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── 3. JSON Export ──
function exportAuditLogAsJson(investigation: InvestigateResponse, eventId: string) {
  const payload = {
    exported_at: new Date().toISOString(),
    event_id: eventId,
    model_provider: investigation.model_provider,
    total_duration_seconds: investigation.total_duration_seconds,
    tool_execution_steps: investigation.tool_execution_steps,
    evidence: investigation.evidence,
    structured_summary: investigation.structured_summary,
    report_markdown: investigation.report_markdown,
    audit_metadata: {
      tool: 'FinGraph Sentinel',
      version: '1.0.0',
      decision_support_only: true,
      disclaimer: 'This investigation highlights factual anomalies for human review only. It does not declare fraud or criminal activity.'
    }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${eventId}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const InvestigationDrawer: React.FC<InvestigationDrawerProps> = ({
  investigation,
  isLoading,
  eventId,
  onClose
}) => {
  const isOpen = isLoading || investigation !== null;
  const [isReviewed, setIsReviewed] = React.useState(() =>
    eventId ? !!getReviewedEvents()[eventId] : false
  );
  const [reviewedAt, setReviewedAt] = React.useState<string | null>(() => {
    if (!eventId) return null;
    return getReviewedEvents()[eventId]?.reviewedAt ?? null;
  });
  const [showExportMenu, setShowExportMenu] = useState(false);

  React.useEffect(() => {
    if (eventId) {
      const r = getReviewedEvents()[eventId];
      setIsReviewed(!!r);
      setReviewedAt(r?.reviewedAt ?? null);
    }
  }, [eventId]);

  if (!isOpen) return null;

  const steps = investigation?.tool_execution_steps ?? [];
  const summary = investigation?.structured_summary;
  const evidence = investigation?.evidence;

  const handleMarkReviewed = () => {
    if (!eventId) return;
    markEventReviewed(eventId);
    setIsReviewed(true);
    setReviewedAt(new Date().toISOString());
  };

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
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-white text-sm">
                    AI Investigation Report
                  </h2>
                  {isReviewed && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Reviewed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {investigation?.model_provider ?? 'Strands Agent (Amazon Bedrock)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
              {reviewedAt && (
                <span className="text-[9px] text-slate-500 font-mono shrink-0">
                  Reviewed {new Date(reviewedAt).toLocaleString()}
                </span>
              )}
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

              <div className="mt-3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/50 text-[10px] text-slate-500 leading-relaxed">
                ⚠️ <strong className="text-slate-400">Decision-Support Notice:</strong> This report highlights factual financial anomalies for human review. It does not declare legal accusations or alter balances.
              </div>
            </div>
          )}

          {summary && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
              <h3 className="text-xs font-semibold text-cyan-300 mb-2">Recommended Action</h3>
              <p className="text-xs text-slate-300">{summary.recommended_action}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3 relative">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          {investigation && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkReviewed}
                disabled={isReviewed}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg border transition-all ${
                  isReviewed
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300 cursor-default'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isReviewed ? 'text-emerald-400' : ''}`} />
                {isReviewed ? '✓ Reviewed' : 'Mark as Reviewed'}
              </button>

              {/* Export Selector Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Audit Log</span>
                </button>

                {/* Export Options Popover Menu */}
                {showExportMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl bg-slate-900 border border-slate-700 p-2 shadow-2xl z-50 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                      Choose Export Format
                    </div>

                    {/* PDF (Primary / Recommended) */}
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        if (eventId) exportAuditLogAsPdf(investigation, eventId);
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/60 hover:bg-cyan-900/80 text-left transition-colors cursor-pointer group"
                    >
                      <div className="p-1 rounded bg-cyan-900 text-cyan-300 group-hover:text-white shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white text-xs">PDF Document</span>
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 text-[9px] font-bold">
                            Primary
                          </span>
                        </div>
                        <span className="text-[10px] text-cyan-200/80 block mt-0.5">
                          Formatted report with color metrics & verified trace
                        </span>
                      </div>
                    </button>

                    {/* CSV */}
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        if (eventId) exportAuditLogAsCsv(investigation, eventId);
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-200 text-xs block">CSV Spreadsheet</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Tabular tool steps & duration data
                        </span>
                      </div>
                    </button>

                    {/* JSON */}
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        if (eventId) exportAuditLogAsJson(investigation, eventId);
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                        <FileCode2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-200 text-xs block">JSON Raw Telemetry</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Full machine-readable payload
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
