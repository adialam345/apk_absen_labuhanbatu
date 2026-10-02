import React, { useState, useEffect } from 'react';
import { logger, LogEntry } from '../lib/logger';
import { Terminal, X, Trash2, Copy, Check, AlertCircle, ArrowUpRight, ArrowDownLeft, Info, Bug, ShieldAlert } from 'lucide-react';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'API'>('ALL');
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ERROR') return log.type === 'ERROR';
    if (filter === 'API') return log.type === 'API_REQUEST' || log.type === 'API_RESPONSE';
    return true;
  });

  const handleCopyLogs = () => {
    const text = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md h-[85vh] bg-slate-900 text-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Console Log & Debug</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h3>
              <p className="text-[10px] text-slate-400">Pencatatan Request API & Error Realtime</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLogs}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1"
              title="Salin Semua Log"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-mono">{copied ? 'Tersalin' : 'Copy'}</span>
            </button>
            <button
              onClick={() => logger.clearLogs()}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300"
              title="Hapus Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-700/50 flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
              filter === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            ALL ({logs.length})
          </button>
          <button
            onClick={() => setFilter('API')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
              filter === 'API'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            API ({logs.filter((l) => l.type === 'API_REQUEST' || l.type === 'API_RESPONSE').length})
          </button>
          <button
            onClick={() => setFilter('ERROR')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
              filter === 'ERROR'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            ERROR ({logs.filter((l) => l.type === 'ERROR').length})
          </button>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <Bug className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>Belum ada catatan log aktivitas.</span>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    log.type === 'ERROR'
                      ? 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-950/60'
                      : log.type === 'API_REQUEST'
                      ? 'bg-blue-950/30 border-blue-800/50 hover:bg-blue-950/50'
                      : log.type === 'API_RESPONSE'
                      ? 'bg-emerald-950/30 border-emerald-800/50 hover:bg-emerald-950/50'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">{log.timestamp}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                        log.type === 'ERROR'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : log.type === 'API_REQUEST'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : log.type === 'API_RESPONSE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {log.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    {log.type === 'ERROR' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    ) : log.type === 'API_REQUEST' ? (
                      <ArrowUpRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-100 text-[11px] truncate">
                        {log.title}
                      </p>
                      {log.endpoint && (
                        <p className="text-[10px] text-slate-400 truncate">{log.endpoint}</p>
                      )}
                      {log.error && (
                        <p className="text-[10px] text-rose-300 mt-0.5 leading-tight">{log.error}</p>
                      )}
                    </div>
                  </div>

                  {/* Expand Details */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 space-y-2 text-[10px]">
                      {log.payload && (
                        <div>
                          <span className="text-slate-400 block font-bold mb-0.5">Payload Dikirim:</span>
                          <pre className="p-2 bg-slate-950 rounded-lg text-blue-300 overflow-x-auto max-h-32">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.response && (
                        <div>
                          <span className="text-slate-400 block font-bold mb-0.5">Respons Server:</span>
                          <pre className="p-2 bg-slate-950 rounded-lg text-emerald-300 overflow-x-auto max-h-32">
                            {JSON.stringify(log.response, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.durationMs !== undefined && (
                        <div className="text-slate-400 text-right">
                          Waktu Eksekusi: <span className="text-slate-200 font-bold">{log.durationMs} ms</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/80 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-brand-400" />
          <span>Klik kartu log di atas untuk melihat rincian isi payload & respons.</span>
        </div>
      </div>
    </div>
  );
};
