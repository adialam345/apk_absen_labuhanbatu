import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Building2 } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  onOpenSettings?: () => void;
  onOpenDebug?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenDebug }) => {
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Secret Easter Egg Trigger: Ketuk Avatar 5 kali dengan cepat untuk membuka log debug rahasia
  const handleSecretAvatarTap = () => {
    const now = Date.now();
    if (now - lastTapTime < 800) {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        setTapCount(0);
        if (onOpenDebug) onOpenDebug();
      }
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar Inisial / Foto (Dengan Secret 5-Tap Listener untuk Buka Log Debug) */}
          <button
            type="button"
            onClick={handleSecretAvatarTap}
            className="w-10 h-10 rounded-xl bg-brand-800 text-white flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 focus:outline-none active:scale-95 transition-transform cursor-pointer"
            title={user.nama}
          >
            {user.foto ? (
              <img src={user.foto} alt={user.nama} className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <span className="pointer-events-none">{user.nama.slice(0, 2).toUpperCase()}</span>
            )}
          </button>

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

        {/* Status Online (Tanpa tombol Log yang terlihat) */}
        <div className="flex items-center gap-2">
          {/* Hidden secret tap area on Online badge */}
          <button
            type="button"
            onClick={handleSecretAvatarTap}
            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1.5 focus:outline-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Online</span>
          </button>
        </div>
      </div>
    </header>
  );
};
