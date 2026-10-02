import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppVersionInfo, RegisteredUser } from '../types';
import { StorageService } from './storage';

// Current App Version (Sync with package.json / Android versionCode)
export const CURRENT_APP_VERSION = {
  version_code: 20,
  version_name: '2.0.1'
};

// Default Supabase configuration
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cxhnnuizdkeywzgsxnvy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cBsEdMAO20MN9pxMND0JQw__UvyC5s3';

let supabaseInstance: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance;

  const customConfig = await StorageService.getCustomSupabaseConfig();
  const url = customConfig?.url || DEFAULT_SUPABASE_URL;
  const key = customConfig?.anonKey || DEFAULT_SUPABASE_ANON_KEY;

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export const SupabaseService = {
  /**
   * Cek apakah NIP terdaftar dalam Whitelist Supabase (Tabel registered_users)
   */
  async checkNipWhitelist(nip: string): Promise<{ isAllowed: boolean; user?: RegisteredUser; reason?: string }> {
    try {
      const client = await getSupabase();
      const { data, error } = await client
        .from('registered_users')
        .select('*')
        .eq('nip', nip)
        .maybeSingle();

      if (error) {
        // Jika tabel belum dibuat di Supabase, izinkan NIP admin atau default untuk transisi
        console.warn('Registered users table check warning:', error.message);
        return { isAllowed: true, user: { nip, nama: 'User Default', role: nip === 'admin' ? 'admin' : 'pegawai', is_active: true } };
      }

      if (!data) {
        return {
          isAllowed: false,
          reason: 'Akses Ditolak: NIP Anda belum terdaftar dalam sistem whitelist aplikasi. Hubungi Admin untuk pendaftaran NIP.'
        };
      }

      const regUser = data as RegisteredUser;
      if (!regUser.is_active) {
        return {
          isAllowed: false,
          reason: 'Akses Dinonaktifkan: NIP Anda telah dinonaktifkan oleh Admin. Hubungi Admin untuk mengaktifkan kembali.'
        };
      }

      return { isAllowed: true, user: regUser };
    } catch (err: any) {
      console.warn('Whitelist check fallback:', err);
      return { isAllowed: true, user: { nip, nama: 'User Default', role: nip === 'admin' ? 'admin' : 'pegawai', is_active: true } };
    }
  },

  /**
   * Mengambil semua daftar NIP whitelist (Khusus Admin)
   */
  async getRegisteredUsers(): Promise<RegisteredUser[]> {
    try {
      const client = await getSupabase();
      const { data, error } = await client
        .from('registered_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as RegisteredUser[];
    } catch {
      return [];
    }
  },

  /**
   * Menambahkan NIP Baru ke Whitelist (Khusus Admin)
   */
  async addRegisteredUser(user: { nip: string; nama?: string; opd?: string; role: 'admin' | 'pegawai' }): Promise<{ success: boolean; message: string }> {
    try {
      const client = await getSupabase();
      const cleanNip = user.nip.trim();
      const cleanNama = user.nama?.trim() || `Pegawai (${cleanNip})`;
      const { error } = await client
        .from('registered_users')
        .insert([{
          nip: cleanNip,
          nama: cleanNama,
          opd: user.opd?.trim() || 'Pemerintah Kabupaten Labuhanbatu',
          role: user.role,
          is_active: true,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        if (error.code === '23505') {
          return { success: false, message: 'NIP ini sudah terdaftar sebelumnya!' };
        }
        return { success: false, message: error.message };
      }
      return { success: true, message: `NIP ${cleanNip} berhasil didaftarkan!` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menambahkan NIP' };
    }
  },

  /**
   * Mengubah Status Aktif / Nonaktif NIP (Khusus Admin)
   */
  async toggleUserStatus(nip: string, isActive: boolean): Promise<boolean> {
    try {
      const client = await getSupabase();
      const { error } = await client
        .from('registered_users')
        .update({ is_active: isActive })
        .eq('nip', nip);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Menghapus NIP dari Whitelist (Khusus Admin)
   */
  async deleteRegisteredUser(nip: string): Promise<boolean> {
    try {
      const client = await getSupabase();
      const { error } = await client
        .from('registered_users')
        .delete()
        .eq('nip', nip);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Cek apakah ada versi baru di tabel app_versions
   */
  async checkLatestVersion(): Promise<{ hasUpdate: boolean; isMandatory: boolean; latestVersion: AppVersionInfo | null }> {
    try {
      const client = await getSupabase();
      const { data, error } = await client
        .from('app_versions')
        .select('*')
        .order('version_code', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { hasUpdate: false, isMandatory: false, latestVersion: null };
      }

      const latest = data as AppVersionInfo;
      const hasUpdate = latest.version_code > CURRENT_APP_VERSION.version_code;
      const isMandatory = hasUpdate && (latest.is_mandatory || CURRENT_APP_VERSION.version_code < latest.min_version_code);

      return { hasUpdate, isMandatory, latestVersion: latest };
    } catch (err) {
      console.warn('Supabase version check skipped:', err);
      return { hasUpdate: false, isMandatory: false, latestVersion: null };
    }
  },

  /**
   * Upload foto presensi: Membedakan foto MASUK ({nip}_masuk.jpg) dan PULANG ({nip}_pulang.jpg)
   * Selalu menimpa foto lama per kategori (Hemat Storage: Maksimal 2 foto per pegawai).
   */
  async uploadAttendancePhoto(fileDataUrl: string, nip: string, type: 'masuk' | 'pulang'): Promise<string | null> {
    try {
      const client = await getSupabase();
      const fileName = `${nip}_${type}.jpg`;

      // Convert data URL to Blob
      const response = await fetch(fileDataUrl);
      const blob = await response.blob();

      const { data, error } = await client.storage
        .from('attendance-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true // TIMPA FOTO LAMA PER KATEGORI (MASUK / PULANG)
        });

      if (error) throw error;

      const { data: publicUrlData } = client.storage
        .from('attendance-photos')
        .getPublicUrl(fileName);

      return `${publicUrlData.publicUrl}?t=${Date.now()}`;
    } catch (err) {
      console.error('Failed to upload photo to Supabase Storage:', err);
      return null;
    }
  },

  /**
   * Catat presensi ke Supabase: Menyimpan kolom MASUK, PULANG, dan TOKEN dalam 1 baris per NIP (UPSERT)
   */
  async logAttendanceRecord(logData: {
    nip: string;
    nama: string;
    status: 'Masuk' | 'Pulang';
    latitude: number;
    longitude: number;
    jarak: number;
    status_lokasi: string;
    ip_address?: string;
    foto_url?: string;
    token?: string;
  }): Promise<boolean> {
    try {
      const client = await getSupabase();
      const nowIso = new Date().toISOString();

      // Siapkan payload dinamis sesuai tipe presensi (Masuk atau Pulang)
      const updatePayload: Record<string, any> = {
        nip: logData.nip,
        nama: logData.nama,
        status_terakhir: logData.status,
        updated_at: nowIso
      };

      if (logData.token) {
        updatePayload.token = logData.token;
      }

      if (logData.status === 'Masuk') {
        updatePayload.masuk_waktu = nowIso;
        updatePayload.masuk_lat = logData.latitude;
        updatePayload.masuk_lng = logData.longitude;
        updatePayload.masuk_jarak = logData.jarak;
        updatePayload.masuk_ip = logData.ip_address || '-';
        if (logData.foto_url) updatePayload.masuk_foto = logData.foto_url;
      } else {
        updatePayload.pulang_waktu = nowIso;
        updatePayload.pulang_lat = logData.latitude;
        updatePayload.pulang_lng = logData.longitude;
        updatePayload.pulang_jarak = logData.jarak;
        updatePayload.pulang_ip = logData.ip_address || '-';
        if (logData.foto_url) updatePayload.pulang_foto = logData.foto_url;
      }

      // UPSERT ke tabel attendance_logs berdasarkan Primary Key (NIP)
      const { error } = await client
        .from('attendance_logs')
        .upsert(updatePayload, { onConflict: 'nip' });

      return !error;
    } catch (err) {
      console.warn('Upsert attendance log failed:', err);
      return false;
    }
  }
};
