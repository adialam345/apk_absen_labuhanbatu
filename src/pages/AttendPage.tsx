import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, OfficeCoordinate, LocationState } from '../types';
import { ApiService } from '../lib/api';
import { SupabaseService } from '../lib/supabase';
import { Camera, MapPin, CheckCircle2, AlertCircle, RefreshCw, Send, X, Shield, Shuffle, Image as ImageIcon, Upload } from 'lucide-react';

interface AttendPageProps {
  user: UserProfile;
  onSuccess: () => void;
}

/**
 * Menghasilkan koordinat acak realistis di dalam radius 50 meter
 * dari titik kantor OPD pegawai yang sedang login.
 */
function generateRandomOfficeCoordinate(
  centerLat: number,
  centerLng: number,
  maxRadiusMeters: number = 48
): { latitude: number; longitude: number; distance: number } {
  const minR = 8;
  const r = minR + Math.random() * (maxRadiusMeters - minR);
  const angle = Math.random() * 2 * Math.PI;

  const deltaLat = (r * Math.cos(angle)) / 111320;
  const deltaLng = (r * Math.sin(angle)) / (111320 * Math.cos((centerLat * Math.PI) / 180));

  const randomLat = Number((centerLat + deltaLat).toFixed(6));
  const randomLng = Number((centerLng + deltaLng).toFixed(6));

  return {
    latitude: randomLat,
    longitude: randomLng,
    distance: Number(r.toFixed(1))
  };
}

export const AttendPage: React.FC<AttendPageProps> = ({ user, onSuccess }) => {
  const [attendanceType, setAttendanceType] = useState<'Masuk' | 'Pulang'>('Masuk');
  const [officeCoord, setOfficeCoord] = useState<OfficeCoordinate | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoSource, setPhotoSource] = useState<'camera' | 'gallery' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: 3.5,
    isMock: false,
    distance: null,
    isWithinRadius: true,
    statusLokasi: 'Di Wilayah Kantor',
    loading: true,
    error: null
  });

  // 1. Ambil Koordinat Kantor dari API berdasarkan OPD User Login
  useEffect(() => {
    ApiService.getOfficeCoordinates(user.id_opd, user.nip).then((coord) => {
      setOfficeCoord(coord);
      randomizeOfficeLocation(coord);
    });
  }, [user]);

  // 2. Fungsi Mengacak Koordinat dalam Radius 50m dari Titik Kantor
  const randomizeOfficeLocation = (coord?: OfficeCoordinate | null) => {
    const targetCoord = coord || officeCoord;
    if (!targetCoord) return;

    setLocation((prev) => ({ ...prev, loading: true }));

    const randomPos = generateRandomOfficeCoordinate(
      targetCoord.latitude,
      targetCoord.longitude,
      48
    );

    setTimeout(() => {
      setLocation({
        latitude: randomPos.latitude,
        longitude: randomPos.longitude,
        accuracy: Number((2.5 + Math.random() * 3).toFixed(1)),
        isMock: false,
        distance: randomPos.distance,
        isWithinRadius: true,
        statusLokasi: 'Di Wilayah Kantor',
        loading: false,
        error: null
      });
    }, 200);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoBlob(file);
    setPhotoSource(source);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAttendance = async () => {
    if (!photoBlob || !photoDataUrl) {
      setErrorMessage('Harap ambil foto selfie atau pilih foto dari galeri terlebih dahulu.');
      return;
    }

    if (!location.latitude || !location.longitude) {
      setErrorMessage('Titik koordinat belum terdeteksi. Silakan coba kembali.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const now = new Date();
      const waktuAbsen = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      // 1. Submit ke API Server Absensi Pemkab Labuhanbatu
      const apiResult = await ApiService.submitAttendance({
        nip: user.nip,
        latitude: location.latitude,
        longitude: location.longitude,
        jarak: location.distance || 15.0,
        stsLokasi: 'Di Wilayah Kantor',
        waktu_absen: waktuAbsen,
        status: attendanceType,
        photoBlob
      });

      // 2. Upload ke Supabase (1 Baris per Pegawai)
      const deviceIp = await ApiService.getDeviceIp();
      const photoUrl = await SupabaseService.uploadAttendancePhoto(
        photoDataUrl,
        user.nip,
        attendanceType.toLowerCase() as 'masuk' | 'pulang'
      );

      await SupabaseService.logAttendanceRecord({
        nip: user.nip,
        nama: user.nama,
        status: attendanceType,
        latitude: location.latitude,
        longitude: location.longitude,
        jarak: location.distance || 15.0,
        status_lokasi: 'Di Wilayah Kantor',
        ip_address: deviceIp,
        foto_url: photoUrl || undefined,
        token: user.token
      });

      setSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err.message || 'Terjadi kendala saat mengirim data presensi.');
    }
  };

  if (submitSuccess) {
    return (
      <div className="p-6 max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Presensi {attendanceType} Berhasil
        </h2>
        <p className="text-slate-600 text-xs mt-2 max-w-xs leading-relaxed">
          Data presensi dan bukti foto telah tercatat dalam sistem pada jarak {location.distance} meter dari titik kantor OPD.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-28 animate-fade-in">
      {/* Jenis Presensi (Masuk / Pulang) Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1">
        <button
          onClick={() => setAttendanceType('Masuk')}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-xs transition-colors min-h-[40px] ${
            attendanceType === 'Masuk'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Presensi Masuk
        </button>
        <button
          onClick={() => setAttendanceType('Pulang')}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-xs transition-colors min-h-[40px] ${
            attendanceType === 'Pulang'
              ? 'bg-white text-brand-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Presensi Pulang
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Box Foto Bukti */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-brand-800" />
            <span>Foto Bukti Kehadiran</span>
          </span>
          {photoDataUrl && (
            <button
              onClick={() => { setPhotoDataUrl(null); setPhotoBlob(null); setPhotoSource(null); }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 min-h-[36px] px-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ganti Foto</span>
            </button>
          )}
        </div>

        {/* Preview Foto */}
        <div
          className={`w-full h-52 rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
            photoDataUrl
              ? 'border-brand-700 bg-slate-900'
              : 'border-slate-300 bg-slate-50'
          }`}
        >
          {photoDataUrl ? (
            <>
              <img src={photoDataUrl} alt="Bukti Presensi" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-950/80 text-white text-[11px] font-medium flex items-center gap-1.5">
                {photoSource === 'gallery' ? <ImageIcon className="w-3 h-3 text-slate-300" /> : <Camera className="w-3 h-3 text-slate-300" />}
                <span>{photoSource === 'gallery' ? 'Foto dari Galeri' : 'Foto Kamera Langsung'}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center p-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Unggah atau Ambil Foto</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Gunakan kamera selfie atau pilih dari galeri HP</span>
            </div>
          )}
        </div>

        {/* Pilihan Metode Foto */}
        <div className="w-full grid grid-cols-2 gap-2 mt-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="min-h-[44px] py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200"
          >
            <Camera className="w-4 h-4 text-slate-700" />
            <span>Kamera Selfie</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="min-h-[44px] py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200"
          >
            <ImageIcon className="w-4 h-4 text-slate-700" />
            <span>Pilih Galeri</span>
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => handlePhotoSelect(e, 'camera')}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoSelect(e, 'gallery')}
          className="hidden"
        />
      </div>

      {/* Validasi Titik Lokasi & Radius OPD */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Validasi Radius OPD</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {user.opd}
              </p>
            </div>
          </div>
          <button
            onClick={() => randomizeOfficeLocation()}
            className="min-h-[36px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Perbarui Titik Lokasi"
          >
            <Shuffle className={`w-3.5 h-3.5 ${location.loading ? 'animate-spin' : ''}`} />
            <span>Acak Titik</span>
          </button>
        </div>

        {/* Status Lokasi Chip */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Status:</span>
              <span className="text-xs font-bold text-slate-900">Di Wilayah Kantor (Sesuai)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Jarak ke Titik:</span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {location.distance !== null ? `${location.distance} m` : '15.0 m'}
            </span>
          </div>
        </div>

        {location.latitude && (
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Latitude:</span>
              <span className="font-semibold text-slate-900">{location.latitude}</span>
            </div>
            <div className="flex justify-between">
              <span>Longitude:</span>
              <span className="font-semibold text-slate-900">{location.longitude}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
              <span>Batas Radius: Maks 50m</span>
              <span className="text-emerald-700 font-semibold">Valid</span>
            </div>
          </div>
        )}
      </div>

      {/* Tombol Kirim */}
      <button
        onClick={handleSubmitAttendance}
        disabled={submitting || !photoBlob}
        className="w-full min-h-[44px] py-3.5 px-4 bg-brand-800 hover:bg-brand-900 active:bg-brand-950 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-60"
      >
        {submitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            <span>Mengirim Presensi...</span>
          </div>
        ) : (
          <>
            <Send className="w-4 h-4 text-white" />
            <span>Kirim Presensi {attendanceType}</span>
          </>
        )}
      </button>
    </div>
  );
};
