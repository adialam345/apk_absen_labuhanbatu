import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ApiService } from '../lib/api';
import { User, Lock, LogOut, Settings, KeyRound, CheckCircle2, AlertCircle, Shield, Users, Building } from 'lucide-react';

interface ProfilePageProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAdminWhitelist?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onOpenSettings, onOpenAdminWhitelist }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loadingPass, setLoadingPass] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPasswordModal) {
        setShowPasswordModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPasswordModal]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPasswordError('Harap isi password lama dan password baru.');
      return;
    }

    setLoadingPass(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const result = await ApiService.changePassword(user.nip, oldPassword, newPassword);
    setLoadingPass(false);

    if (result.success) {
      setPasswordSuccess(result.message);
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } else {
      setPasswordError(result.message);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-28 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-800" />
            <span>Profil Pengguna</span>
          </h2>
          <p className="text-xs text-slate-500">Informasi identitas akun ASN</p>
        </div>

        {user.role === 'admin' && (
          <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </span>
        )}
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-800 text-white flex items-center justify-center font-bold text-xl overflow-hidden mb-3">
          {user.foto ? (
            <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
          ) : (
            <span>{user.nama.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 text-sm">{user.nama}</h3>
        <p className="text-xs font-mono text-slate-600 mt-0.5">NIP. {user.nip}</p>

        <div className="mt-4 pt-3 border-t border-slate-100 w-full space-y-2 text-left text-xs">
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Unit Kerja:</span>
            <span className="font-semibold text-slate-900 max-w-[200px] text-right truncate">{user.opd}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">ID OPD:</span>
            <span className="font-mono font-semibold text-slate-900">{user.id_opd}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Peran Sistem:</span>
            <span className={`font-semibold capitalize ${user.role === 'admin' ? 'text-amber-800' : 'text-emerald-800'}`}>
              {user.role || 'Pegawai'}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Navigasi Pengaturan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {/* Khusus Akun Admin: Kelola Whitelist NIP */}
        {user.role === 'admin' && onOpenAdminWhitelist && (
          <button
            onClick={onOpenAdminWhitelist}
            className="w-full min-h-[44px] p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Kelola Whitelist NIP</span>
                <span className="text-[10px] text-slate-500 block">Daftarkan NIP pegawai yang diizinkan</span>
              </div>
            </div>
          </button>
        )}

        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full min-h-[44px] p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Ubah Kata Sandi</span>
              <span className="text-[10px] text-slate-500 block">Perbarui password akun</span>
            </div>
          </div>
        </button>

        {/* Khusus Akun Admin: Pengaturan Server & Supabase */}
        {user.role === 'admin' && (
          <button
            onClick={onOpenSettings}
            className="w-full min-h-[44px] p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">Pengaturan Server</span>
                <span className="text-[10px] text-slate-500 block">Konfigurasi endpoint & Supabase (Khusus Admin)</span>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Tombol Logout */}
      <button
        onClick={onLogout}
        className="w-full min-h-[44px] py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun</span>
      </button>

      {/* Modal Ubah Kata Sandi */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-800" />
                <span>Ubah Kata Sandi</span>
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold min-h-[36px] px-2"
              >
                Tutup
              </button>
            </div>

            {passwordError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password Lama</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Password saat ini"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-brand-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-brand-700"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full min-h-[44px] mt-2 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {loadingPass ? 'Menyimpan...' : 'Simpan Kata Sandi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
