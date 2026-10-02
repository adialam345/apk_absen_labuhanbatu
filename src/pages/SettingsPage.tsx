import React, { useState, useEffect } from 'react';
import { StorageService } from '../lib/storage';
import { SupabaseService } from '../lib/supabase';
import { Settings, Database, Server, Save, CheckCircle2, ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { Alert } from '../components/Alert';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [serverUrl, setServerUrl] = useState('http://ola.labuhanbatukab.go.id');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    StorageService.getServerUrl().then(setServerUrl);
    StorageService.getCustomSupabaseConfig().then((cfg) => {
      if (cfg) {
        setSupabaseUrl(cfg.url);
        setSupabaseAnonKey(cfg.anonKey);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await StorageService.setServerUrl(serverUrl);
    if (supabaseUrl && supabaseAnonKey) {
      await StorageService.setCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      const { latestVersion } = await SupabaseService.checkLatestVersion();
      if (latestVersion) {
        setSupabaseStatus(`Terhubung! Versi Cloud: v${latestVersion.version_name} (Code: ${latestVersion.version_code})`);
      } else {
        setSupabaseStatus('Terhubung ke Supabase (Tabel app_versions siap digunakan).');
      }
    } catch (err: any) {
      setSupabaseStatus(`Gagal terhubung: ${err.message || 'Periksa URL dan Key'}`);
    }
    setTestingSupabase(false);
  };

  const sqlSchema = `-- Schema Supabase Whitelist & Presensi 1 Baris
CREATE TABLE IF NOT EXISTS public.registered_users (
  nip TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  opd TEXT DEFAULT 'Pemerintah Kabupaten Labuhanbatu',
  role TEXT DEFAULT 'pegawai' CHECK (role IN ('admin', 'pegawai')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-brand-800" />
            <span>Pengaturan Server & Cloud</span>
          </h2>
          <p className="text-xs text-slate-500">Konfigurasi endpoint dan basis data</p>
        </div>
      </div>

      {savedSuccess && (
        <Alert variant="success" onClose={() => setSavedSuccess(false)}>
          Pengaturan berhasil disimpan.
        </Alert>
      )}

      {/* Form Konfigurasi */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Server OLA API */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Server className="w-4 h-4 text-brand-800" />
            <h3 className="font-bold text-slate-900 text-xs">Server Utama OLA Labuhanbatu</h3>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Base URL Server</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://ola.labuhanbatukab.go.id"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-brand-700 min-h-[44px]"
            />
            <p className="text-[10px] text-slate-500 mt-1">Endpoint REST API backend presensi pegawai.</p>
          </div>
        </div>

        {/* Supabase Cloud */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-800" />
              <h3 className="font-bold text-slate-900 text-xs">Supabase Cloud Database</h3>
            </div>
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={testingSupabase}
              className="min-h-[36px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
              <span>Uji Koneksi</span>
            </button>
          </div>

          {supabaseStatus && (
            <Alert
              variant={supabaseStatus.startsWith('Terhubung') ? 'success' : 'error'}
              onClose={() => setSupabaseStatus(null)}
            >
              <span className="font-mono">{supabaseStatus}</span>
            </Alert>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Supabase Project URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-brand-700 min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Supabase Anon Key</label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-brand-700 min-h-[44px]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full min-h-[44px] py-3 px-4 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Konfigurasi</span>
        </button>
      </form>
    </div>
  );
};
