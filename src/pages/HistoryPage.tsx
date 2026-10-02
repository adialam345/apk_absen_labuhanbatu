import React, { useState, useEffect } from 'react';
import { UserProfile, AttendanceRecord } from '../types';
import { ApiService } from '../lib/api';
import { FileText, Calendar, MapPin, RefreshCw } from 'lucide-react';

interface HistoryPageProps {
  user: UserProfile;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ user }) => {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const data = await ApiService.getAttendanceHistory(user.nip);
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-28 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-800" />
            <span>Riwayat Kehadiran</span>
          </h2>
          <p className="text-xs text-slate-500">Rekap daftar presensi kerja Anda</p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Segarkan Riwayat"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-800' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-brand-800 rounded-full animate-spin mb-2"></div>
          <span className="text-xs text-slate-500">Memuat riwayat kehadiran...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/90 shadow-sm">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Riwayat</h3>
          <p className="text-xs text-slate-500 mt-1">Data absensi akan muncul setelah Anda melakukan presensi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, idx) => (
            <div
              key={item.id_absen || idx}
              className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.tanggal}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                  {item.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] font-medium text-slate-500 block">Jam Masuk</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{item.jam_masuk || '--:--'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] font-medium text-slate-500 block">Jam Pulang</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{item.jam_pulang || '--:--'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{item.sts_lokasi}</span>
                </div>
                <span className="text-brand-900 font-semibold">{item.keterangan || 'Tepat Waktu'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
