import React, { useState, useEffect } from 'react';
import { UserProfile, AttendanceToday, OfficeCoordinate } from '../types';
import { ApiService } from '../lib/api';
import { DigitalClock } from '../components/DigitalClock';
import { Clock, MapPin, ArrowUpRight, ArrowDownLeft, Wifi, RefreshCw, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface DashboardPageProps {
  user: UserProfile;
  onNavigateToAttend: () => void;
  onNavigateToHistory: () => void;
  onNavigateToSchedule: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onNavigateToAttend,
  onNavigateToHistory,
  onNavigateToSchedule
}) => {
  const [todayData, setTodayData] = useState<AttendanceToday | null>(null);
  const [officeCoord, setOfficeCoord] = useState<OfficeCoordinate | null>(null);
  const [deviceIp, setDeviceIp] = useState<string>('Memuat IP...');
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    const [today, coord, ip] = await Promise.all([
      ApiService.getTodayAttendance(user.nip),
      ApiService.getOfficeCoordinates(user.id_opd, user.nip),
      ApiService.getDeviceIp()
    ]);
    setTodayData(today);
    setOfficeCoord(coord);
    setDeviceIp(ip);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24 animate-fade-in">
      {/* Jam Digital & Tanggal */}
      <DigitalClock />

      {/* Baris Informasi IP & Status Jaringan */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-slate-500" />
          <span>IP Publik:</span>
          <span className="font-mono font-semibold text-slate-900">{deviceIp}</span>
        </div>
        <button
          onClick={loadDashboardData}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Segarkan Data Presensi"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-700' : ''}`} />
        </button>
      </div>

      {/* Card Ringkasan Presensi Hari Ini */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-800" />
            <h2 className="font-bold text-slate-900 text-sm">Status Presensi Hari Ini</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
            {todayData?.keterangan || 'Hari Kerja'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Masuk */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Masuk</span>
              <div className={`p-1 rounded-md ${todayData?.masuk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-slate-900">
                {todayData?.masuk || '--:--'}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {todayData?.masuk ? 'Presensi tercatat' : 'Belum absen masuk'}
              </p>
            </div>
          </div>

          {/* Pulang */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pulang</span>
              <div className={`p-1 rounded-md ${todayData?.pulang ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-slate-900">
                {todayData?.pulang || '--:--'}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {todayData?.pulang ? 'Presensi tercatat' : 'Belum absen pulang'}
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Utama Presensi */}
        <button
          onClick={onNavigateToAttend}
          className="w-full min-h-[44px] mt-4 py-3 px-4 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>
            {!todayData?.masuk
              ? 'Lakukan Presensi Masuk'
              : !todayData?.pulang
              ? 'Lakukan Presensi Pulang'
              : 'Presensi Hari Ini Lengkap'}
          </span>
        </button>
      </div>

      {/* Info Kantor & Validasi Koordinat */}
      {officeCoord && (
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-brand-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-xs truncate">
              {officeCoord.nama_opd}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Batas Radius Kantor: <span className="font-semibold text-slate-900">{officeCoord.radius} Meter</span>
            </p>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
              Titik: {officeCoord.latitude.toFixed(6)}, {officeCoord.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {/* Menu Navigasi Cepat */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigateToHistory}
          className="min-h-[44px] p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 text-left transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 block">Riwayat</span>
            <span className="text-[10px] text-slate-500 block">Rekap presensi</span>
          </div>
        </button>

        <button
          onClick={onNavigateToSchedule}
          className="min-h-[44px] p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 text-left transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 block">Jadwal</span>
            <span className="text-[10px] text-slate-500 block">Jam kerja OPD</span>
          </div>
        </button>
      </div>
    </div>
  );
};
