import React, { useState, useEffect } from 'react';
import { UserProfile, WorkSchedule } from '../types';
import { ApiService } from '../lib/api';
import { CalendarDays, Clock, Building2, AlertCircle } from 'lucide-react';

interface SchedulePageProps {
  user: UserProfile;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({ user }) => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getSchedule(user.id_opd, user.nip).then((data) => {
      setSchedules(data);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-28 animate-fade-in">
      <div>
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand-800" />
          <span>Jadwal Jam Kerja</span>
        </h2>
        <p className="text-xs text-slate-500">Ketentuan jam presensi dinas harian</p>
      </div>

      {/* OPD Header Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
          <Building2 className="w-4 h-4 text-brand-800" />
          <span>Unit Kerja (OPD)</span>
        </div>
        <h3 className="font-bold text-sm text-slate-900 leading-snug">{user.opd}</h3>
      </div>

      {/* Notice info */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
        <span>
          Lakukan presensi masuk dan pulang sesuai rentang toleransi jam kerja agar status kehadiran tercatat tepat waktu.
        </span>
      </div>

      {/* List of Schedules */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Memuat jadwal kerja...</div>
        ) : (
          schedules.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-brand-900 font-bold text-xs flex items-center justify-center">
                  {item.hari.slice(0, 3)}
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900">{item.hari}</h4>
                  <span className="text-[10px] text-slate-500">Hari Kerja</span>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="flex items-center gap-1 font-mono font-bold text-slate-900 justify-end">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.jam_mulai_masuk} : {item.jam_mulai_pulang}</span>
                </div>
                <span className="text-[10px] text-slate-600">Batas Masuk: {item.jam_akhir_masuk}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
