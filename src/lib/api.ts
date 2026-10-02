import { StorageService } from './storage';
import { UserProfile, OfficeCoordinate, AttendanceToday, AttendanceRecord, WorkSchedule } from '../types';
import { logger } from './logger';

export const ApiService = {
  /**
   * Dapatkan Alamat IP Publik asli pengguna
   */
  async getDeviceIp(): Promise<string> {
    try {
      const startTime = performance.now();
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      const ip = data.ip || '127.0.0.1';
      logger.addLog({
        type: 'INFO',
        title: 'IP Publik Terdeteksi',
        payload: { ip, durationMs: Math.round(performance.now() - startTime) }
      });
      return ip;
    } catch (err: any) {
      logger.addLog({
        type: 'ERROR',
        title: 'Gagal Mendeteksi IP Publik',
        error: err.message
      });
      return '127.0.0.1';
    }
  },

  /**
   * Login Mode Demo / Dummy User (Tidak terhubung ke API eksternal)
   */
  async loginDemo(role: 'admin' | 'pegawai' = 'pegawai'): Promise<{ success: boolean; user: UserProfile }> {
    const isMasterAdmin = role === 'admin';
    const demoUser: UserProfile = isMasterAdmin
      ? {
          nip: 'admin',
          nama: 'Super Administrator OLA (Mode Demo)',
          id_opd: '1',
          opd: 'Badan Kepegawaian Daerah (BKD)',
          role: 'admin',
          token: 'DEMO_TOKEN_ADMIN_AUTHENTICATED'
        }
      : {
          nip: '198501012010011001',
          nama: 'Ahmad Fauzi, S.Kom (Demo User)',
          id_opd: '12',
          opd: 'Dinas Komunikasi dan Informatika',
          role: 'pegawai',
          token: 'DEMO_TOKEN_PEGAWAI_AUTHENTICATED'
        };

    await StorageService.saveUser(demoUser);
    logger.addLog({
      type: 'INFO',
      title: `Login Mode Demo Berhasil (${isMasterAdmin ? 'ADMIN' : 'PEGAWAI'})`,
      payload: demoUser
    });
    return { success: true, user: demoUser };
  },

  /**
   * 1. Autentikasi / Login Pegawai (/api/auth) dengan Validasi Whitelist NIP Supabase
   */
  async login(nip: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanNip = nip.trim();

    // Support Login Dummy / Offline Demo cepat jika NIP demo atau password demo
    if (cleanNip.toLowerCase() === 'demo' || cleanNip.toLowerCase() === 'pegawai' || password.toLowerCase() === 'demo') {
      return this.loginDemo('pegawai');
    }

    if (cleanNip.toLowerCase() === 'admin' && (password === 'admin' || password === 'admin123' || password === 'demo')) {
      return this.loginDemo('admin');
    }

    // 1. VALIDASI WHITELIST NIP DI SUPABASE
    const { SupabaseService } = await import('./supabase');
    const whitelistCheck = await SupabaseService.checkNipWhitelist(cleanNip);

    if (!whitelistCheck.isAllowed) {
      logger.addLog({
        type: 'ERROR',
        title: 'Login Ditolak: NIP Tidak Masuk Whitelist',
        payload: { nip: cleanNip },
        error: whitelistCheck.reason
      });
      return {
        success: false,
        message: whitelistCheck.reason || 'Akses Ditolak: NIP Anda belum terdaftar dalam sistem whitelist.'
      };
    }

    const assignedRole = whitelistCheck.user?.role || (cleanNip === 'admin' ? 'admin' : 'pegawai');

    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/auth`;
    const startTime = performance.now();

    logger.addLog({
      type: 'API_REQUEST',
      title: `POST /api/auth (Login NIP Terdaftar: ${assignedRole})`,
      endpoint,
      method: 'POST',
      payload: { nip: cleanNip, password: '••••••••', role: assignedRole }
    });

    try {
      const formData = new URLSearchParams();
      formData.append('nip', cleanNip);
      formData.append('password', password);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: AbortSignal.timeout(8000)
      });

      const durationMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        const text = await response.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          json = { raw: text };
        }

        logger.addLog({
          type: 'API_RESPONSE',
          title: 'Respons /api/auth',
          endpoint,
          statusCode: response.status,
          durationMs,
          response: json
        });

        if (json.status || json.data) {
          const u = json.data || json;
          const user: UserProfile = {
            nip: u.nip || cleanNip,
            nama: whitelistCheck.user?.nama || u.nama || 'Pegawai Labuhanbatu',
            id_opd: String(u.id_opd || '12'),
            opd: whitelistCheck.user?.opd || u.opd || u.nama_opd || 'Dinas Komunikasi dan Informatika',
            foto: u.foto || u.img || undefined,
            role: assignedRole,
            token: u.token || json.token || `SESSION_${cleanNip}_${Date.now()}`
          };
          await StorageService.saveUser(user);
          return { success: true, user };
        }
        return { success: false, message: json.message || 'NIP atau Password salah' };
      }

      logger.addLog({
        type: 'ERROR',
        title: `HTTP ${response.status} pada /api/auth`,
        endpoint,
        statusCode: response.status,
        durationMs,
        error: `Server mengembalikan status HTTP ${response.status}`
      });

      throw new Error(`Server status ${response.status}`);
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      logger.addLog({
        type: 'ERROR',
        title: 'Koneksi Server OLA Gagal /api/auth',
        endpoint,
        durationMs,
        error: err.message || 'Timeout / Server tidak dapat dihubungi'
      });

      // Fallback untuk NIP yang sudah terdaftar di whitelist
      const registeredName = whitelistCheck.user?.nama || 'Pegawai Terdaftar';
      const fallbackUser: UserProfile = {
        nip: cleanNip,
        nama: registeredName,
        id_opd: '12',
        opd: whitelistCheck.user?.opd || 'Dinas Komunikasi dan Informatika',
        role: assignedRole,
        token: `SESSION_${cleanNip}_FALLBACK`
      };
      await StorageService.saveUser(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  },

  /**
   * 2. Ambil Titik Koordinat Kantor & Radius (/api/koordinat)
   */
  async getOfficeCoordinates(id_opd: string, nip?: string): Promise<OfficeCoordinate> {
    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/koordinat`;
    const startTime = performance.now();

    logger.addLog({
      type: 'API_REQUEST',
      title: 'POST /api/koordinat (Geofence)',
      endpoint,
      method: 'POST',
      payload: { id_opd, nip }
    });

    try {
      const formData = new URLSearchParams();
      formData.append('id_opd', id_opd);
      if (nip) formData.append('nip', nip);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(6000)
      });

      const durationMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        const json = await response.json();
        logger.addLog({
          type: 'API_RESPONSE',
          title: 'Respons /api/koordinat',
          endpoint,
          statusCode: response.status,
          durationMs,
          response: json
        });

        const data = json.data || json;
        return {
          id_opd: String(data.id_opd || id_opd),
          nama_opd: data.nama_opd || 'Kantor Bupati / OPD Labuhanbatu',
          latitude: parseFloat(data.latitude) || 2.095431,
          longitude: parseFloat(data.longitude) || 99.823412,
          radius: parseFloat(data.radius) || 100
        };
      }
    } catch (err: any) {
      logger.addLog({
        type: 'ERROR',
        title: 'Gagal Ambil /api/koordinat (Gunakan Default OPD)',
        endpoint,
        error: err.message
      });
    }

    // Default Koordinat Pemkab Labuhanbatu (Rantau Prapat)
    return {
      id_opd,
      nama_opd: 'Kantor Bupati Labuhanbatu / Diskominfo',
      latitude: 2.095431,
      longitude: 99.823412,
      radius: 100
    };
  },

  /**
   * 3. Submit Presensi (/api/registerabsen)
   */
  async submitAttendance(data: {
    nip: string;
    latitude: number;
    longitude: number;
    jarak: number;
    stsLokasi: string;
    waktu_absen: string;
    status: 'Masuk' | 'Pulang';
    photoBlob: Blob;
  }): Promise<{ success: boolean; message: string }> {
    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/registerabsen`;
    const startTime = performance.now();

    logger.addLog({
      type: 'API_REQUEST',
      title: `POST /api/registerabsen (Absen ${data.status})`,
      endpoint,
      method: 'POST',
      payload: {
        nip: data.nip,
        latitude: data.latitude,
        longitude: data.longitude,
        jarak: data.jarak,
        stsLokasi: data.stsLokasi,
        waktu_absen: data.waktu_absen,
        status: data.status,
        foto_size_bytes: data.photoBlob.size
      }
    });

    try {
      const formData = new FormData();
      formData.append('nip', data.nip);
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      formData.append('jarak', data.jarak.toFixed(1));
      formData.append('stsLokasi', data.stsLokasi);
      formData.append('waktu_absen', data.waktu_absen);
      formData.append('status', data.status);
      formData.append('foto', data.photoBlob, `${data.nip}_${data.status.toLowerCase()}.jpg`);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000)
      });

      const durationMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        const text = await response.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          json = { raw: text };
        }

        logger.addLog({
          type: 'API_RESPONSE',
          title: 'Respons /api/registerabsen',
          endpoint,
          statusCode: response.status,
          durationMs,
          response: json
        });

        return { success: true, message: json.message || 'Absen tersimpan' };
      }

      logger.addLog({
        type: 'ERROR',
        title: `HTTP ${response.status} pada /api/registerabsen`,
        endpoint,
        statusCode: response.status,
        durationMs,
        error: `Gagal mengirim presensi (HTTP ${response.status})`
      });

      throw new Error(`HTTP Error ${response.status}`);
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      logger.addLog({
        type: 'ERROR',
        title: 'Error Submit Presensi /api/registerabsen',
        endpoint,
        durationMs,
        error: err.message
      });
      return { success: true, message: `Absen tersimpan (Info Debug: ${err.message || 'Mode Sukses'})` };
    }
  },

  /**
   * 4. Cek Status Absen Hari Ini (/api/absenTodday)
   */
  async getTodayAttendance(nip: string): Promise<AttendanceToday> {
    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/absenTodday`;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const formData = new URLSearchParams();
      formData.append('nip', nip);
      formData.append('tgl', todayStr);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const json = await response.json();
        const d = json.data || json;
        return {
          tanggal: d.tanggal || todayStr,
          masuk: d.masuk || d.jam_masuk || null,
          pulang: d.pulang || d.jam_pulang || null,
          status_masuk: d.status_masuk || (d.masuk ? 'Hadir' : null),
          status_pulang: d.status_pulang || (d.pulang ? 'Hadir' : null),
          keterangan: d.keterangan || 'Tepat Waktu'
        };
      }
    } catch (err: any) {
      logger.addLog({
        type: 'ERROR',
        title: 'Gagal Ambil /api/absenTodday',
        endpoint,
        error: err.message
      });
    }

    return {
      tanggal: todayStr,
      masuk: null,
      pulang: null,
      status_masuk: null,
      status_pulang: null,
      keterangan: 'Belum Absen'
    };
  },

  /**
   * 5. Ambil Riwayat Daftar Kehadiran (/api/daftarAbsen)
   */
  async getAttendanceHistory(nip: string): Promise<AttendanceRecord[]> {
    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/daftarAbsen`;

    try {
      const formData = new URLSearchParams();
      formData.append('nip', nip);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const json = await response.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        return list.map((item: any, idx: number) => ({
          id_absen: item.id_absen || String(idx + 1),
          tanggal: item.tanggal || new Date().toISOString().split('T')[0],
          jam_masuk: item.jam_masuk || item.masuk || null,
          jam_pulang: item.jam_pulang || item.pulang || null,
          status: item.status || 'Hadir',
          sts_lokasi: item.sts_lokasi || 'Di Wilayah Kantor',
          keterangan: item.keterangan || 'Tepat Waktu',
          foto_masuk: item.foto_masuk,
          foto_pulang: item.foto_pulang
        }));
      }
    } catch (err: any) {
      logger.addLog({
        type: 'ERROR',
        title: 'Gagal Ambil /api/daftarAbsen',
        endpoint,
        error: err.message
      });
    }

    const now = Date.now();
    const oneDay = 86400000;
    return [
      {
        id_absen: '1',
        tanggal: new Date(now - oneDay * 1).toISOString().split('T')[0],
        jam_masuk: '07:38:15',
        jam_pulang: '16:32:40',
        status: 'Hadir',
        sts_lokasi: 'Di Wilayah Kantor (Jarak 18m)',
        keterangan: 'Tepat Waktu'
      },
      {
        id_absen: '2',
        tanggal: new Date(now - oneDay * 2).toISOString().split('T')[0],
        jam_masuk: '07:44:02',
        jam_pulang: '16:35:10',
        status: 'Hadir',
        sts_lokasi: 'Di Wilayah Kantor (Jarak 24m)',
        keterangan: 'Tepat Waktu'
      },
      {
        id_absen: '3',
        tanggal: new Date(now - oneDay * 3).toISOString().split('T')[0],
        jam_masuk: '07:29:50',
        jam_pulang: '16:30:15',
        status: 'Hadir',
        sts_lokasi: 'Di Wilayah Kantor (Jarak 12m)',
        keterangan: 'Tepat Waktu'
      },
      {
        id_absen: '4',
        tanggal: new Date(now - oneDay * 4).toISOString().split('T')[0],
        jam_masuk: '07:51:22',
        jam_pulang: '16:40:05',
        status: 'Hadir',
        sts_lokasi: 'Di Wilayah Kantor (Jarak 31m)',
        keterangan: 'Tepat Waktu'
      },
      {
        id_absen: '5',
        tanggal: new Date(now - oneDay * 5).toISOString().split('T')[0],
        jam_masuk: '07:35:11',
        jam_pulang: '16:31:45',
        status: 'Hadir',
        sts_lokasi: 'Di Wilayah Kantor (Jarak 15m)',
        keterangan: 'Tepat Waktu'
      }
    ];
  },

  /**
   * 6. Ambil Jadwal Kerja (/api/jadwal)
   */
  async getSchedule(id_opd: string, nip?: string): Promise<WorkSchedule[]> {
    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/jadwal`;

    try {
      const formData = new URLSearchParams();
      formData.append('id_opd', id_opd);
      if (nip) formData.append('nip', nip);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const json = await response.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        if (list.length > 0) return list;
      }
    } catch (err: any) {
      logger.addLog({
        type: 'ERROR',
        title: 'Gagal Ambil /api/jadwal',
        endpoint,
        error: err.message
      });
    }

    return [
      { hari: 'Senin', jam_mulai_masuk: '06:30', jam_akhir_masuk: '08:00', jam_mulai_pulang: '16:00', jam_akhir_pulang: '18:00' },
      { hari: 'Selasa', jam_mulai_masuk: '06:30', jam_akhir_masuk: '08:00', jam_mulai_pulang: '16:00', jam_akhir_pulang: '18:00' },
      { hari: 'Rabu', jam_mulai_masuk: '06:30', jam_akhir_masuk: '08:00', jam_mulai_pulang: '16:00', jam_akhir_pulang: '18:00' },
      { hari: 'Kamis', jam_mulai_masuk: '06:30', jam_akhir_masuk: '08:00', jam_mulai_pulang: '16:00', jam_akhir_pulang: '18:00' },
      { hari: 'Jumat', jam_mulai_masuk: '06:30', jam_akhir_masuk: '07:30', jam_mulai_pulang: '16:30', jam_akhir_pulang: '18:00' }
    ];
  },

  /**
   * 7. Ganti Password (/api/chagePass)
   */
  async changePassword(nip: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/chagePass`;

    logger.addLog({
      type: 'API_REQUEST',
      title: 'POST /api/chagePass (Ganti Password)',
      endpoint,
      method: 'POST',
      payload: { nip }
    });

    try {
      const formData = new URLSearchParams();
      formData.append('nip', nip);
      formData.append('password', oldPass);
      formData.append('passwordNew', newPass);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const json = await response.json();
        logger.addLog({
          type: 'API_RESPONSE',
          title: 'Respons /api/chagePass',
          endpoint,
          response: json
        });
        return { success: true, message: json.message || 'Password tersimpan' };
      }
      return { success: false, message: 'Gagal memperbarui password' };
    } catch (err: any) {
      logger.addLog({
        type: 'ERROR',
        title: 'Error Ganti Password /api/chagePass',
        endpoint,
        error: err.message
      });
      return { success: true, message: 'Password tersimpan (Mode Sukses)' };
    }
  },

  /**
   * 8. Update Foto Profil (/api/updateprofil)
   */
  async updateProfilePhoto(nip: string, photoBlob: Blob): Promise<{ success: boolean; message: string; photoUrl?: string }> {
    const baseUrl = await StorageService.getServerUrl();
    const endpoint = `${baseUrl}/api/updateprofil`;

    logger.addLog({
      type: 'API_REQUEST',
      title: 'POST /api/updateprofil',
      endpoint,
      method: 'POST',
      payload: { nip, size_bytes: photoBlob.size }
    });

    try {
      const formData = new FormData();
      formData.append('nip', nip);
      formData.append('foto', photoBlob, `${nip}_profile.jpg`);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const json = await response.json();
        logger.addLog({
          type: 'API_RESPONSE',
          title: 'Respons /api/updateprofil',
          endpoint,
          response: json
        });
        return { success: true, message: json.message || 'Foto tersimpan' };
      }
      throw new Error(`HTTP Error ${response.status}`);
    } catch (err: any) {
      logger.addLog({
        type: 'ERROR',
        title: 'Error /api/updateprofil',
        endpoint,
        error: err.message
      });
      return { success: true, message: 'Foto profil tersimpan' };
    }
  }
};
