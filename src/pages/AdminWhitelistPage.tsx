import React, { useState, useEffect } from 'react';
import { RegisteredUser } from '../types';
import { SupabaseService } from '../lib/supabase';
import { UserPlus, Users, Search, Trash2, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Power, Building2, Crown, User, Shield } from 'lucide-react';
import { Alert } from '../components/Alert';

interface AdminWhitelistPageProps {
  onBack: () => void;
}

export const AdminWhitelistPage: React.FC<AdminWhitelistPageProps> = ({ onBack }) => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNip, setNewNip] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newOpd, setNewOpd] = useState('Dinas Komunikasi dan Informatika');
  const [newRole, setNewRole] = useState<'admin' | 'pegawai'>('pegawai');
  const [formLoading, setFormLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await SupabaseService.getRegisteredUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNip.trim() || !newNama.trim()) {
      setFeedbackMessage({ type: 'error', text: 'NIP dan Nama Pegawai wajib diisi!' });
      return;
    }

    setFormLoading(true);
    setFeedbackMessage(null);

    const result = await SupabaseService.addRegisteredUser({
      nip: newNip,
      nama: newNama,
      opd: newOpd,
      role: newRole
    });

    setFormLoading(false);

    if (result.success) {
      setFeedbackMessage({ type: 'success', text: result.message });
      setNewNip('');
      setNewNama('');
      fetchUsers();
      setTimeout(() => {
        setShowAddModal(false);
        setFeedbackMessage(null);
      }, 1500);
    } else {
      setFeedbackMessage({ type: 'error', text: result.message });
    }
  };

  const handleToggleStatus = async (nip: string, currentStatus: boolean) => {
    const ok = await SupabaseService.toggleUserStatus(nip, !currentStatus);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.nip === nip ? { ...u, is_active: !currentStatus } : u))
      );
    }
  };

  const handleDeleteUser = async (nip: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus NIP ${nip} (${nama}) dari daftar whitelist?`)) {
      const ok = await SupabaseService.deleteRegisteredUser(nip);
      if (ok) {
        setUsers((prev) => prev.filter((u) => u.nip !== nip));
      }
    }
  };

  const filteredUsers = users.filter((u) =>
    u.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.opd && u.opd.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Kembali ke Halaman Profil"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-800" />
              <span>Whitelist NIP Pegawai</span>
            </h2>
            <p className="text-xs text-slate-500">Kelola akses login aplikasi</p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          aria-label="Segarkan Daftar Whitelist"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-800' : ''}`} />
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-brand-800 flex items-center justify-center font-bold text-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 block">Total Whitelist</span>
            <span className="text-xs text-slate-500">{users.length} NIP Terdaftar di Database</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[40px] px-3.5 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah NIP</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan NIP atau nama pegawai..."
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-700 min-h-[44px]"
        />
      </div>

      {/* List of Registered Users */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-7 h-7 border-2 border-slate-300 border-t-brand-800 rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-slate-500">Memuat daftar whitelist...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Pegawai</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Tidak ditemukan data yang sesuai dengan pencarian.' : 'Belum ada NIP yang didaftarkan ke whitelist.'}
            </p>
          </div>
        ) : (
          filteredUsers.map((item) => (
            <div
              key={item.nip}
              className={`bg-white rounded-xl p-3.5 border transition-colors ${
                item.is_active ? 'border-slate-200 shadow-sm' : 'border-slate-200 bg-slate-50/70 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.role === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.role === 'admin' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.nama}
                      </h4>
                      {item.role === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold text-[9px] border border-amber-200">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5">{item.nip}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{item.opd || 'Pemerintah Kab. Labuhanbatu'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle & Delete Action */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleStatus(item.nip, !!item.is_active)}
                    className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                      item.is_active
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                    }`}
                    title={item.is_active ? 'Nonaktifkan Akses' : 'Aktifkan Akses'}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  {item.nip !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(item.nip, item.nama)}
                      className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Hapus dari Whitelist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah NIP Pegawai Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-800" />
                <span>Tambah NIP ke Whitelist</span>
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setFeedbackMessage(null); }}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold min-h-[36px] px-2"
              >
                Tutup
              </button>
            </div>

            {feedbackMessage && (
              <Alert
                variant={feedbackMessage.type}
                className="mb-3"
                onClose={() => setFeedbackMessage(null)}
              >
                {feedbackMessage.text}
              </Alert>
            )}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">NIP (Nomor Induk Pegawai)</label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="Contoh: 198501012010011001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-brand-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap Pegawai</label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi, S.Kom"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-brand-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Kerja (OPD)</label>
                <input
                  type="text"
                  value={newOpd}
                  onChange={(e) => setNewOpd(e.target.value)}
                  placeholder="Contoh: Dinas Komunikasi dan Informatika"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-brand-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Peran Akun</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'pegawai')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-brand-700"
                >
                  <option value="pegawai">Pegawai ASN (Biasa)</option>
                  <option value="admin">Administrator (Akses Whitelist)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full min-h-[44px] mt-2 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {formLoading ? 'Mendaftarkan...' : 'Daftarkan NIP'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
