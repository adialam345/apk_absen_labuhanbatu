import React from 'react';
import { Home, Camera, FileText, CalendarDays, User } from 'lucide-react';

export type TabType = 'dashboard' | 'attend' | 'history' | 'schedule' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Beranda', icon: Home },
    { id: 'history' as TabType, label: 'Riwayat', icon: FileText },
    { id: 'attend' as TabType, label: 'Presensi', icon: Camera, isPrimary: true },
    { id: 'schedule' as TabType, label: 'Jadwal', icon: CalendarDays },
    { id: 'profile' as TabType, label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom,0px)] shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="relative -top-3 flex flex-col items-center group min-w-[54px] min-h-[44px]"
                aria-label="Lakukan Presensi"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-800 hover:bg-brand-900 active:bg-brand-950 flex items-center justify-center text-white shadow-md border-2 border-white transition-colors">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-brand-900 mt-0.5">Presensi</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors min-h-[44px] min-w-[54px] justify-center ${
                isActive
                  ? 'text-brand-800 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-800' : 'text-slate-500'}`} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
