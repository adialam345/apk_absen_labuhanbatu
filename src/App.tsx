import React, { useState, useEffect } from 'react';
import { UserProfile, AppVersionInfo } from './types';
import { StorageService } from './lib/storage';
import { SupabaseService, CURRENT_APP_VERSION } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { ForceUpdateModal } from './components/ForceUpdateModal';
import { DebugModal } from './components/DebugModal';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AttendPage } from './pages/AttendPage';
import { HistoryPage } from './pages/HistoryPage';
import { SchedulePage } from './pages/SchedulePage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminWhitelistPage } from './pages/AdminWhitelistPage';
import { Terminal } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminWhitelist, setShowAdminWhitelist] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Force Update state
  const [updateAvailable, setUpdateAvailable] = useState<AppVersionInfo | null>(null);

  // 1. Initial Load (Check User Session & Check Supabase Version)
  useEffect(() => {
    const initApp = async () => {
      // Load user session
      const savedUser = await StorageService.getUser();
      if (savedUser) setUser(savedUser);

      // Check version update in Supabase
      const { hasUpdate, latestVersion } = await SupabaseService.checkLatestVersion();
      if (hasUpdate && latestVersion) {
        setUpdateAvailable(latestVersion);
      }

      setLoadingSession(false);
    };

    initApp();
  }, []);

  const handleLogout = async () => {
    await StorageService.clearUser();
    setUser(null);
    setActiveTab('dashboard');
    setShowSettings(false);
    setShowAdminWhitelist(false);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-blue-500 rounded-3xl p-1 shadow-2xl animate-pulse mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-slate-900 rounded-[20px] flex items-center justify-center font-extrabold text-2xl text-brand-400">
            OLA
          </div>
        </div>
        <h2 className="text-lg font-bold">Absensi Online Labuhanbatu</h2>
        <p className="text-xs text-slate-400 mt-1">Memuat data sistem...</p>
      </div>
    );
  }

  // Not logged in -> Show Login Page or Settings
  if (!user) {
    return (
      <>
        {showSettings ? (
          <div className="min-h-screen bg-slate-50">
            <SettingsPage onBack={() => setShowSettings(false)} />
          </div>
        ) : (
          <LoginPage
            onLoginSuccess={(u) => setUser(u)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {/* Floating Debug Button on Login Screen */}
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-4 right-4 z-40 p-3 bg-slate-950/90 text-emerald-400 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-1.5 text-xs font-mono font-bold active:scale-95 transition-all"
        >
          <Terminal className="w-4 h-4" />
          <span>DEBUG LOGS</span>
        </button>

        <DebugModal isOpen={showDebug} onClose={() => setShowDebug(false)} />

        {updateAvailable && (
          <ForceUpdateModal
            versionInfo={updateAvailable}
            currentVersionName={CURRENT_APP_VERSION.version_name}
          />
        )}
      </>
    );
  }

  // Logged in -> Show App with Navbar, Content, BottomNav
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDebug={() => setShowDebug(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {showSettings ? (
          <SettingsPage onBack={() => setShowSettings(false)} />
        ) : showAdminWhitelist ? (
          <AdminWhitelistPage onBack={() => setShowAdminWhitelist(false)} />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                user={user}
                onNavigateToAttend={() => setActiveTab('attend')}
                onNavigateToHistory={() => setActiveTab('history')}
                onNavigateToSchedule={() => setActiveTab('schedule')}
              />
            )}
            {activeTab === 'attend' && (
              <AttendPage
                user={user}
                onSuccess={() => setActiveTab('dashboard')}
              />
            )}
            {activeTab === 'history' && <HistoryPage user={user} />}
            {activeTab === 'schedule' && <SchedulePage user={user} />}
            {activeTab === 'profile' && (
              <ProfilePage
                user={user}
                onLogout={handleLogout}
                onOpenSettings={() => setShowSettings(true)}
                onOpenAdminWhitelist={() => setShowAdminWhitelist(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Floating Navigation (Hide on Settings or Admin Panel) */}
      {!showSettings && !showAdminWhitelist && (
        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      )}

      {/* Debug Console Modal */}
      <DebugModal isOpen={showDebug} onClose={() => setShowDebug(false)} />

      {/* Force Update Modal Overlay if new version in Supabase */}
      {updateAvailable && (
        <ForceUpdateModal
          versionInfo={updateAvailable}
          currentVersionName={CURRENT_APP_VERSION.version_name}
        />
      )}
    </div>
  );
}

export default App;
