-- ==============================================================================
-- SQL SETUP SUPABASE: SISTEM WHITELIST NIP, ROLE ADMIN, & PRESENSI 1 BARIS
-- Jalankan di: https://supabase.com/dashboard/project/cxhnnuizdkeywzgsxnvy/sql/new
-- ==============================================================================

-- ==============================================================================
-- 1. TABEL REGISTERED USERS (WHITELIST NIP & ROLE ADMIN/PEGAWAI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registered_users (
  nip TEXT PRIMARY KEY,                 -- NIP unik Pegawai atau 'admin'
  nama TEXT NOT NULL,                   -- Nama Lengkap Pegawai
  opd TEXT DEFAULT 'Pemerintah Kabupaten Labuhanbatu', -- Instansi / OPD
  role TEXT DEFAULT 'pegawai' CHECK (role IN ('admin', 'pegawai')), -- Role Akun
  is_active BOOLEAN DEFAULT true,       -- Status Aktif (true = Boleh Login, false = Diblokir)
  remarks TEXT,                         -- Catatan Tambahan (Opsional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. TABEL APP VERSIONS (Untuk Auto-Update & Force-Update APK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_code INTEGER NOT NULL,
  version_name TEXT NOT NULL,
  min_version_code INTEGER NOT NULL,
  apk_url TEXT NOT NULL,
  changelog TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. TABEL ATTENDANCE LOGS (1 BARIS PER PEGAWAI: MASUK + PULANG + TOKEN)
-- ==============================================================================
DROP TABLE IF EXISTS public.attendance_logs;

CREATE TABLE public.attendance_logs (
  nip TEXT PRIMARY KEY,                 -- NIP unik Pegawai
  nama TEXT,                            -- Nama Pegawai
  token TEXT,                           -- TOKEN Sesi / Autentikasi Pegawai
  status_terakhir TEXT,                 -- 'Masuk' atau 'Pulang'
  
  -- KOLOM ABSEN MASUK
  masuk_waktu TIMESTAMP WITH TIME ZONE, -- Waktu Absen Masuk
  masuk_lat DOUBLE PRECISION,           -- Latitude Masuk
  masuk_lng DOUBLE PRECISION,           -- Longitude Masuk
  masuk_jarak DOUBLE PRECISION,         -- Jarak ke Kantor saat Masuk (Meter)
  masuk_ip TEXT,                        -- IP Perangkat saat Masuk
  masuk_foto TEXT,                      -- Link Foto Selfie Masuk

  -- KOLOM ABSEN PULANG
  pulang_waktu TIMESTAMP WITH TIME ZONE,-- Waktu Absen Pulang
  pulang_lat DOUBLE PRECISION,          -- Latitude Pulang
  pulang_lng DOUBLE PRECISION,          -- Longitude Pulang
  pulang_jarak DOUBLE PRECISION,        -- Jarak ke Kantor saat Pulang (Meter)
  pulang_ip TEXT,                       -- IP Perangkat saat Pulang
  pulang_foto TEXT,                     -- Link Foto Selfie Pulang

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. POLICIES (Hak Akses Tabel)
-- ==============================================================================
-- Akses Tabel registered_users
DROP POLICY IF EXISTS "Public Read Registered Users" ON public.registered_users;
CREATE POLICY "Public Read Registered Users" ON public.registered_users 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Manage Registered Users" ON public.registered_users;
CREATE POLICY "Public Manage Registered Users" ON public.registered_users 
  FOR ALL USING (true) WITH CHECK (true);

-- Akses Tabel app_versions
DROP POLICY IF EXISTS "Public Read App Versions" ON public.app_versions;
CREATE POLICY "Public Read App Versions" ON public.app_versions 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role Manage App Versions" ON public.app_versions;
CREATE POLICY "Service Role Manage App Versions" ON public.app_versions 
  FOR ALL USING (true) WITH CHECK (true);

-- Akses Tabel attendance_logs
DROP POLICY IF EXISTS "Public Manage Attendance Logs" ON public.attendance_logs;
CREATE POLICY "Public Manage Attendance Logs" ON public.attendance_logs 
  FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. STORAGE BUCKETS SETUP (Public)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('apk-releases', 'apk-releases', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access APK Storage" ON storage.objects;
CREATE POLICY "Public Access APK Storage" ON storage.objects
  FOR ALL USING (bucket_id IN ('apk-releases', 'attendance-photos'))
  WITH CHECK (bucket_id IN ('apk-releases', 'attendance-photos'));

-- ==============================================================================
-- 7. DATA AWAL VERSI APK (v2.0.1)
-- ==============================================================================
INSERT INTO public.app_versions (version_code, version_name, min_version_code, apk_url, changelog, is_mandatory)
VALUES (
  20, 
  '2.0.1', 
  20, 
  'https://cxhnnuizdkeywzgsxnvy.supabase.co/storage/v1/object/public/apk-releases/Absensi_Labuhanbatu_v2.0.1.apk', 
  'Rilis versi awal Absensi Online Labuhanbatu.', 
  false
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 8. DATA AWAL WHITELIST NIP (ADMIN & CONTOH PEGAWAI)
-- ==============================================================================
INSERT INTO public.registered_users (nip, nama, opd, role, is_active, remarks)
VALUES 
  ('admin', 'Super Administrator', 'Dinas Kominfo Labuhanbatu', 'admin', true, 'Akun Master Admin Whitelist'),
  ('198501012010011001', 'Ahmad Fauzi, S.Kom', 'Dinas Komunikasi dan Informatika', 'pegawai', true, 'Pegawai ASN Terverifikasi'),
  ('199002022015022002', 'Siti Nurhaliza, S.STP', 'Badan Kepegawaian Daerah', 'pegawai', true, 'Pegawai ASN Terverifikasi')
ON CONFLICT (nip) DO UPDATE SET
  nama = EXCLUDED.nama,
  opd = EXCLUDED.opd,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  remarks = EXCLUDED.remarks;

-- ==============================================================================
-- 9. DATA DUMMY CONTOH PRESENSI (1 BARIS LENGKAP: MASUK + PULANG + TOKEN)
-- ==============================================================================
INSERT INTO public.attendance_logs (
  nip,
  nama,
  token,
  status_terakhir,
  masuk_waktu,
  masuk_lat,
  masuk_lng,
  masuk_jarak,
  masuk_ip,
  masuk_foto,
  pulang_waktu,
  pulang_lat,
  pulang_lng,
  pulang_jarak,
  pulang_ip,
  pulang_foto,
  updated_at
)
VALUES (
  '198501012010011001',
  'Ahmad Fauzi, S.Kom',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaXAiOiIxOTg1MDEwMTIwMTAwMTEwMDEiLCJleHAiOjE4ODU2OTkyMDB9.EXAMPLE_SESSION_TOKEN_DEMO',
  'Pulang',
  '2026-10-02 07:42:15+07',
  2.095431,
  99.823412,
  18.2,
  '114.125.42.88',
  'https://cxhnnuizdkeywzgsxnvy.supabase.co/storage/v1/object/public/attendance-photos/198501012010011001_masuk.jpg',
  '2026-10-02 16:35:10+07',
  2.095520,
  99.823510,
  22.4,
  '114.125.42.88',
  'https://cxhnnuizdkeywzgsxnvy.supabase.co/storage/v1/object/public/attendance-photos/198501012010011001_pulang.jpg',
  '2026-10-02 16:35:10+07'
)
ON CONFLICT (nip) DO UPDATE SET
  nama = EXCLUDED.nama,
  token = EXCLUDED.token,
  status_terakhir = EXCLUDED.status_terakhir,
  masuk_waktu = EXCLUDED.masuk_waktu,
  masuk_lat = EXCLUDED.masuk_lat,
  masuk_lng = EXCLUDED.masuk_lng,
  masuk_jarak = EXCLUDED.masuk_jarak,
  masuk_ip = EXCLUDED.masuk_ip,
  masuk_foto = EXCLUDED.masuk_foto,
  pulang_waktu = EXCLUDED.pulang_waktu,
  pulang_lat = EXCLUDED.pulang_lat,
  pulang_lng = EXCLUDED.pulang_lng,
  pulang_jarak = EXCLUDED.pulang_jarak,
  pulang_ip = EXCLUDED.pulang_ip,
  pulang_foto = EXCLUDED.pulang_foto,
  updated_at = EXCLUDED.updated_at;
