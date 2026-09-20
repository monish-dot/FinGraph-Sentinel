import React, { useState, useCallback } from 'react';
import {
  UploadCloud,
  FileCheck2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Database,
  Loader2,
  ArrowRight,
  BarChart2,
  ShieldAlert,
} from 'lucide-react';
import { loadDemoScenario, uploadCsvFile, fetchDashboard, fetchAnomalies } from '../services/api';
import type { DashboardMetrics, AnomalyItem } from '../types';

const FILE_SCHEMAS = [
  { key: 'orders', label: 'Orders', filename: 'orders.csv', fields: ['order_id', 'product_id', 'amount', 'date'], icon: '📋' },
  { key: 'transactions', label: 'Transactions', filename: 'transactions.csv', fields: ['transaction_id', 'order_id', 'amount', 'payment_method'], icon: '💳' },
  { key: 'fees', label: 'Fees', filename: 'fees.csv', fields: ['fee_id', 'transaction_id', 'fee_type', 'amount'], icon: '🏷️' },
  { key: 'refunds', label: 'Refunds', filename: 'refunds.csv', fields: ['refund_id', 'order_id', 'amount', 'reason'], icon: '↩️' },
  { key: 'returns', label: 'Returns', filename: 'returns.csv', fields: ['return_id', 'order_id', 'product_id', 'status'], icon: '🔄' },
  { key: 'settlements', label: 'Settlements', filename: 'settlements.csv', fields: ['settlement_id', 'period_start', 'period_end', 'net_amount'], icon: '🏦' },
];

interface UploadedFile {
  key: string;
  file: File;
  status: 'pending' | 'valid' | 'error';
  message?: string;
}

interface AnalysisResult {
  metrics: DashboardMetrics;
  anomalies: AnomalyItem[];
  filesUploaded: number;
}

interface UploadViewProps {
  onDemoLoaded: () => void;
  onNavigateToDashboard?: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onDemoLoaded, onNavigateToDashboard }) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [dragActive, setDragActive] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const [genericFile, setGenericFile] = useState<File | null>(null);
  const [genericFileMessage, setGenericFileMessage] = useState<string | null>(null);

  const validateFile = (key: string, file: File): UploadedFile => {
    if (!file.name.endsWith('.csv')) {
      return { key, file, status: 'error', message: 'Must be a .csv file' };
    }
    if (file.size > 50 * 1024 * 1024) {
      return { key, file, status: 'error', message: 'File too large (>50 MB)' };
    }
    return { key, file, status: 'valid', message: `${(file.size / 1024).toFixed(1)} KB ready` };
  };

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const updates: Record<string, UploadedFile> = {};
    let foundGeneric: File | null = null;

    for (const file of files) {
      const schema = FILE_SCHEMAS.find(s => file.name === s.filename || file.name.startsWith(s.key));
      if (schema) {
        updates[schema.key] = validateFile(schema.key, file);
      } else if (file.name.endsWith('.csv')) {
        foundGeneric = file;
      }
    }

    if (foundGeneric) {
      const generic: File = foundGeneric;
      setGenericFile(generic);
      setGenericFileMessage(`Market dataset ready: ${generic.name} (${(generic.size / 1024).toFixed(1)} KB)`);
    }

    setUploadedFiles(prev => ({ ...prev, ...updates }));
  }, []);


  const handleFileInput = useCallback((key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [key]: validateFile(key, file) }));
    }
  }, []);

  const handleGenericFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setGenericFile(file);
      setGenericFileMessage(`Custom dataset: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  }, []);

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    setDemoResult(null);
    setGenericFile(null);
    try {
      const result = await loadDemoScenario();
      setDemoResult(result.message);
      onDemoLoaded();
    } catch (e: any) {
      setDemoResult('Demo data already loaded. Dashboard is ready.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleUploadAndAnalyze = async () => {
    const validEntries = Object.entries(uploadedFiles).filter(([_, f]) => f.status === 'valid');
    if (validEntries.length === 0 && !genericFile) return;

    setIsUploading(true);
    setUploadError(null);
    setAnalysisResult(null);

    try {
      let filesCount = 0;

      // Handle generic/custom CSV upload (stocks, market series, retail)
      if (genericFile) {
        setUploadProgress(`Ingesting and synthesizing dataset: ${genericFile.name}…`);
        await uploadCsvFile(genericFile);
        filesCount++;
      }

      // Handle standard 6-file entries
      for (let i = 0; i < validEntries.length; i++) {
        const [key, item] = validEntries[i];
        const schema = FILE_SCHEMAS.find(s => s.key === key);
        const targetFilename = schema ? schema.filename : item.file.name;

        setUploadProgress(`Uploading ${targetFilename} (${i + 1}/${validEntries.length})…`);

        const normalizedFile = new File([item.file], targetFilename, { type: item.file.type || 'text/csv' });
        await uploadCsvFile(normalizedFile);
        filesCount++;
      }

      // Fetch fresh analysis results
      setUploadProgress('Analyzing uploaded data & rebuilding financial graph…');
      const [freshMetrics, freshAnomalies] = await Promise.all([
        fetchDashboard(),
        fetchAnomalies(),
      ]);

      setAnalysisResult({
        metrics: freshMetrics,
        anomalies: freshAnomalies,
        filesUploaded: filesCount,
      });

      setUploadProgress(null);
      onDemoLoaded(); // triggers parent refresh
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload and analyze files. Please check network connection.');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };


  const validCount = Object.values(uploadedFiles).filter(f => f.status === 'valid').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Demo Quick Load */}
      <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/20 p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-cyan-900/40 border border-cyan-700/40">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-cyan-200 text-sm">Quick-Load: Hackathon Demo Dataset</h3>
            <p className="text-xs text-slate-400 mt-1">
              Instantly loads the full synthetic marketplace dataset (≈10K transactions, 7 injected anomalies, flagship scenario SET-1029 with ₹3,300 discrepancy) — no upload required.
            </p>
            {demoResult && (
              <div className="mt-2 flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {demoResult}
              </div>
            )}
          </div>
          <button
            onClick={handleLoadDemo}
            disabled={demoLoading || isUploading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            {demoLoading ? 'Loading…' : 'Load Demo Data'}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-950 px-4 text-xs text-slate-500 uppercase tracking-widest">
            Or upload your own seller data
          </span>
        </div>
      </div>

      {/* Drag Drop Zone */}
      <div
        onDrop={handleFileDrop}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        className={`rounded-xl border-2 border-dashed py-8 px-6 text-center transition-all ${
          dragActive
            ? 'border-cyan-500 bg-cyan-950/20'
            : 'border-slate-700 bg-slate-900/20 hover:border-slate-600'
        }`}
      >
        <UploadCloud className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragActive ? 'text-cyan-400' : 'text-slate-600'}`} />
        <p className="text-sm font-medium text-slate-300">Drag & drop your CSV dataset here</p>
        <p className="text-xs text-slate-500 mt-1">
          Accepts any online market / stock market series (Yahoo Finance, Kaggle, Crypto), or marketplace CSVs.
        </p>
        <label className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors">
          <span>Browse Any CSV File</span>
          <input
            type="file"
            accept=".csv"
            disabled={isUploading}
            className="hidden"
            onChange={handleGenericFileInput}
          />
        </label>
      </div>

      {/* Generic Market / Stock File Card */}
      {genericFile && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-950/40 border border-cyan-700/60 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{genericFile.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-900/60 border border-cyan-600 text-cyan-300 text-[10px]">
                  Custom Market / Financial Dataset
                </span>
              </div>
              <div className="text-[11px] text-cyan-200/80 mt-0.5 font-mono">
                {genericFileMessage}
              </div>
            </div>
          </div>
          <button
            onClick={() => { setGenericFile(null); setGenericFileMessage(null); }}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}


      {/* File Schema Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FILE_SCHEMAS.map(schema => {
          const uploaded = uploadedFiles[schema.key];
          const isValid = uploaded?.status === 'valid';
          const isError = uploaded?.status === 'error';

          return (
            <label
              key={schema.key}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                isValid ? 'border-emerald-700/60 bg-emerald-950/20 hover:border-emerald-600'
                : isError ? 'border-rose-700/60 bg-rose-950/20'
                : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                disabled={isUploading}
                className="hidden"
                onChange={e => handleFileInput(schema.key, e)}
              />
              <div className="text-2xl">{schema.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{schema.label}</span>
                  {isValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isError && <XCircle className="w-4 h-4 text-rose-400" />}
                  {!uploaded && <UploadCloud className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{schema.filename}</div>
                {uploaded?.message && (
                  <div className={`text-[10px] mt-0.5 ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {uploaded.message}
                  </div>
                )}
                {!uploaded && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {schema.fields.map(f => (
                      <span key={f} className="px-1 py-0.5 rounded bg-slate-800 text-slate-500 text-[9px] font-mono">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Upload Feedback */}
      {uploadProgress && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-800 text-cyan-200 text-xs font-mono animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
          <span>{uploadProgress}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ── POST-UPLOAD ANALYSIS REPORT ── */}
      {analysisResult && (
        <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/20 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-emerald-200 text-sm">
              Analysis Complete — {analysisResult.filesUploaded} file{analysisResult.filesUploaded > 1 ? 's' : ''} processed
            </h3>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Gross Sales', value: `₹${analysisResult.metrics.gross_sales.toLocaleString('en-IN')}`, color: 'text-cyan-300' },
              { label: 'Net Revenue', value: `₹${analysisResult.metrics.net_revenue.toLocaleString('en-IN')}`, color: 'text-emerald-300' },
              { label: 'Settlement', value: `₹${analysisResult.metrics.settlement_amount.toLocaleString('en-IN')}`, color: 'text-blue-300' },
              { label: 'Platform Fees', value: `₹${analysisResult.metrics.platform_fees.toLocaleString('en-IN')}`, color: 'text-amber-300' },
              { label: 'Refunds', value: `₹${analysisResult.metrics.refunds.toLocaleString('en-IN')}`, color: 'text-rose-300' },
              { label: 'Discrepancy', value: `₹${analysisResult.metrics.settlement_discrepancy_amount.toLocaleString('en-IN')}`, color: 'text-rose-400' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-lg bg-slate-900/60 border border-slate-800 p-2.5 text-center">
                <div className="text-[10px] text-slate-400">{kpi.label}</div>
                <div className={`font-mono font-bold text-sm mt-0.5 ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Detected Anomalies */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-slate-300">
                {analysisResult.anomalies.length} Anomalies Detected
              </span>
            </div>
            <div className="space-y-1">
              {analysisResult.anomalies.slice(0, 5).map(a => (
                <div key={a.anomaly_id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.priority_category === 'HIGH PRIORITY REVIEW' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                    <span className="font-mono text-slate-300">{a.event_id}</span>
                    <span className="text-slate-500 text-[10px]">{a.title}</span>
                  </div>
                  <span className="font-mono text-rose-400 font-semibold">−₹{a.discrepancy_amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {analysisResult.anomalies.length > 5 && (
                <div className="text-[10px] text-slate-500 text-center pt-1">
                  +{analysisResult.anomalies.length - 5} more anomalies
                </div>
              )}
            </div>
          </div>

          {/* Navigate CTA */}
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              View Full Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Button */}
      {(validCount > 0 || genericFile) && !analysisResult && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            {genericFile
              ? `1 custom dataset ready (${genericFile.name})`
              : `${validCount} of ${FILE_SCHEMAS.length} files ready`}
          </div>
          <button
            onClick={handleUploadAndAnalyze}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg hover:shadow-cyan-950/50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing & Analyzing…</span>
              </>
            ) : (
              <span>Upload & Analyze →</span>
            )}
          </button>
        </div>
      )}

      {/* Reset after analysis */}
      {analysisResult && (
        <div className="flex justify-center">
          <button
            onClick={() => { setAnalysisResult(null); setUploadedFiles({}); setGenericFile(null); setGenericFileMessage(null); }}
            className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors cursor-pointer"
          >
            Upload a different dataset
          </button>
        </div>
      )}


      {/* Format Note */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400">
            <strong className="text-amber-300">Note:</strong> FinGraph Sentinel expects the standard marketplace CSV format. Settlement CSV must include a <code className="font-mono text-cyan-400">settlement_id</code> column. Upload triggers a fresh graph rebuild and anomaly re-scoring. Results are shown instantly above — no page reload needed.
          </div>
        </div>
      </div>
    </div>
  );
};
