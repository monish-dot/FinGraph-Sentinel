import React, { useState, useCallback } from 'react';
import { UploadCloud, FileCheck2, XCircle, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { loadDemoScenario } from '../services/api';

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

interface UploadViewProps {
  onDemoLoaded: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onDemoLoaded }) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [dragActive, setDragActive] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<string | null>(null);

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
    files.forEach(file => {
      const schema = FILE_SCHEMAS.find(s => file.name === s.filename || file.name.startsWith(s.key));
      if (schema) {
        updates[schema.key] = validateFile(schema.key, file);
      }
    });
    setUploadedFiles(prev => ({ ...prev, ...updates }));
  }, []);

  const handleFileInput = useCallback((key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [key]: validateFile(key, file) }));
    }
  }, []);

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    setDemoResult(null);
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
            disabled={demoLoading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0"
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
        className={`rounded-xl border-2 border-dashed py-10 px-6 text-center transition-all ${
          dragActive
            ? 'border-cyan-500 bg-cyan-950/20'
            : 'border-slate-700 bg-slate-900/20 hover:border-slate-600'
        }`}
      >
        <UploadCloud className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragActive ? 'text-cyan-400' : 'text-slate-600'}`} />
        <p className="text-sm font-medium text-slate-300">Drag & drop your seller CSV files here</p>
        <p className="text-xs text-slate-500 mt-1">Or click any slot below to browse. Files should match the expected schemas.</p>
      </div>

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

      {/* Upload Button */}
      {validCount > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            {validCount} of {FILE_SCHEMAS.length} files ready
          </div>
          <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-700 to-cyan-700 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-semibold transition-all">
            Upload & Analyze →
          </button>
        </div>
      )}

      {/* Format Note */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400">
            <strong className="text-amber-300">Note:</strong> FinGraph Sentinel expects the same CSV format as the demo dataset. Settlement CSV must include a <code className="font-mono text-cyan-400">settlement_id</code> column. Upload triggers a fresh graph rebuild and anomaly re-scoring.
          </div>
        </div>
      </div>
    </div>
  );
};
