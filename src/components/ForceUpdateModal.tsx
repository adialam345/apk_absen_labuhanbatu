import React, { useState } from 'react';
import { AppVersionInfo } from '../types';
import { Download, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ForceUpdateModalProps {
  versionInfo: AppVersionInfo;
  currentVersionName: string;
}

export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({ versionInfo, currentVersionName }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setDownloadProgress(20);

    // Simulate progress animation for user feedback
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setCompleted(true);
          // Buka URL download APK di browser Android / System download
          window.open(versionInfo.apk_url, '_system');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
        {/* Header Visual */}
        <div className="bg-gradient-to-tr from-brand-700 via-brand-600 to-blue-500 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-inner">
            <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Pembaruan Wajib Tersedia</h3>
          <p className="text-blue-100 text-xs mt-1">
            Versi Baru v{versionInfo.version_name} (Tersedia di Supabase)
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-800 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-600" />
              <span>Pemberitahuan Sistem</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Aplikasi Anda saat ini adalah versi <strong>v{currentVersionName}</strong>. Untuk memastikan presensi GPS dan kamera terkirim dengan lancar, Anda wajib memperbarui ke versi <strong>v{versionInfo.version_name}</strong>.
            </p>
          </div>

          {versionInfo.changelog && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Catatan Rilis (Changelog):
              </span>
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-200/60 max-h-24 overflow-y-auto">
                {versionInfo.changelog}
              </div>
            </div>
          )}

          {/* Progress bar if downloading */}
          {downloading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{completed ? 'Download Selesai!' : 'Mengunduh APK...'}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleDownload}
            disabled={downloading && !completed}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>Buka Berkas APK</span>
              </>
            ) : downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Mengunduh...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download & Pasang Update</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
