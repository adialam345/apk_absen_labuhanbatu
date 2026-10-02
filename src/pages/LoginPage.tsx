import React, { useState } from 'react';
import { ApiService } from '../lib/api';
import { UserProfile } from '../types';
import { Lock, User, AlertCircle, Building2, Server, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenSettings: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onOpenSettings }) => {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip.trim() || !password.trim()) {
      setErrorMessage('Silakan isi NIP dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const result = await ApiService.login(nip, password);
    setLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.message || 'Kredensial tidak sesuai atau NIP belum terdaftar.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Header Lembaga / Pemerintah */}
      <div className="pt-8 pb-3 text-center">
        <div className="w-16 h-16 bg-brand-800 text-white rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          OLA Labuhanbatu
        </h1>
        <p className="text-slate-600 text-xs mt-1">
          Aplikasi Presensi Online Pemerintah Kabupaten Labuhanbatu
        </p>
      </div>

      {/* Card Form Login */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
        <div className="mb-5 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Masuk Akun Pegawai</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan NIP dan kata sandi yang telah didaftarkan
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nip-input" className="text-xs font-semibold text-slate-700 block">
              Nomor Induk Pegawai (NIP)
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="nip-input"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="198501012010011001"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-700 transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pass-input" className="text-xs font-semibold text-slate-700 block">
              Kata Sandi
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="pass-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi akun"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-700 transition-colors"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] mt-2 py-3 px-4 bg-brand-800 hover:bg-brand-900 active:bg-brand-950 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-60"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Memverifikasi Akun...</span>
              </div>
            ) : (
              <span>Masuk Aplikasi</span>
            )}
          </button>
        </form>

        {/* Akses Cepat Mode Uji Coba / Demo */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600">
              Uji Coba Tampilan (Tanpa API Server)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const res = await ApiService.loginDemo('pegawai');
                setLoading(false);
                if (res.success && res.user) onLoginSuccess(res.user);
              }}
              className="min-h-[44px] p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-brand-700 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Pegawai Demo</span>
                <span className="text-[10px] text-slate-500 block">Cek Presensi & Jadwal</span>
              </div>
            </button>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const res = await ApiService.loginDemo('admin');
                setLoading(false);
                if (res.success && res.user) onLoginSuccess(res.user);
              }}
              className="min-h-[44px] p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Admin Demo</span>
                <span className="text-[10px] text-slate-500 block">Cek Panel Whitelist</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-slate-500">
        <p>Pemerintah Kabupaten Labuhanbatu</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Versi 2.0.1</p>
      </div>
    </div>
  );
};
