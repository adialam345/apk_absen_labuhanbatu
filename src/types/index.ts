export type UserRole = 'admin' | 'pegawai';

export interface UserProfile {
  nip: string;
  nama: string;
  id_opd: string;
  opd: string;
  foto?: string;
  jabatan?: string;
  token?: string;
  role?: UserRole;
}

export interface RegisteredUser {
  nip: string;
  nama: string;
  id_opd?: string;
  opd?: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface OfficeCoordinate {
  id_opd: string;
  nama_opd?: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface AttendanceToday {
  tanggal: string;
  masuk?: string | null;
  pulang?: string | null;
  status_masuk?: string | null;
  status_pulang?: string | null;
  keterangan?: string | null;
  foto_masuk?: string | null;
  foto_pulang?: string | null;
}

export interface AttendanceRecord {
  id_absen?: string;
  tanggal: string;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  status: string;
  sts_lokasi: string;
  foto_masuk?: string | null;
  foto_pulang?: string | null;
  keterangan?: string | null;
}

export interface WorkSchedule {
  hari: string;
  jam_mulai_masuk: string;
  jam_akhir_masuk: string;
  jam_mulai_pulang: string;
  jam_akhir_pulang: string;
}

export interface AppVersionInfo {
  id?: string;
  version_code: number;
  version_name: string;
  min_version_code: number;
  apk_url: string;
  changelog?: string;
  is_mandatory: boolean;
  created_at?: string;
}

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isMock: boolean;
  distance: number | null;
  isWithinRadius: boolean;
  statusLokasi: 'Di Wilayah Kantor' | 'Diluar wilayah kantor' | 'Mencari Lokasi...';
  loading: boolean;
  error?: string | null;
}
