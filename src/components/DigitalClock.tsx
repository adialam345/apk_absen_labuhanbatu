import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export const DigitalClock: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(time);

  return (
    <div className="bg-brand-900 rounded-2xl p-5 text-white shadow-sm border border-brand-800 flex flex-col items-center text-center">
      {/* Date Header */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-slate-200 text-xs font-medium mb-2.5">
        <Calendar className="w-3.5 h-3.5 text-slate-300" />
        <span>{formattedDate}</span>
      </div>

      {/* Digital Time */}
      <div className="flex items-baseline gap-1 font-bold">
        <span className="text-4xl font-mono tracking-tight text-white">{hours}:{minutes}</span>
        <span className="text-xl font-mono text-brand-300">:{seconds}</span>
        <span className="text-xs font-bold text-slate-300 uppercase ml-2 px-1.5 py-0.5 bg-white/15 rounded">WIB</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-2.5">
        <Clock className="w-3.5 h-3.5 text-emerald-400" />
        <span>Waktu Indonesia Barat</span>
      </div>
    </div>
  );
};
