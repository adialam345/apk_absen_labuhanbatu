import React from 'react';
import { UserProfile } from '../types';
import { Building2, Terminal } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  onOpenSettings?: () => void;
  onOpenDebug?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenDebug }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar Inisial / Foto */}
          <div className="w-10 h-10 rounded-xl bg-brand-800 text-white flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
            {user.foto ? (
              <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
            ) : (
              <span>{user.nama.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 text-sm leading-snug truncate max-w-[180px]">
              {user.nama}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate max-w-[170px]">{user.opd}</span>
            </div>
          </div>
        </div>

        {/* Status & Diagnostics */}
        <div className="flex items-center gap-2">
          {onOpenDebug && (
            <button
              onClick={onOpenDebug}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-medium flex items-center gap-1 transition-colors min-h-[36px]"
              title="Buka Log Diagnostik"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px]">Log</span>
            </button>
          )}

          <div className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};
