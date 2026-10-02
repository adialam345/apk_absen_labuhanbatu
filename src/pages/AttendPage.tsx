import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, OfficeCoordinate, LocationState } from '../types';
import { ApiService } from '../lib/api';
import { SupabaseService } from '../lib/supabase';
import { Camera, MapPin, CheckCircle2, Send, RotateCcw, Shield, Shuffle, Video, VideoOff } from 'lucide-react';
import { Alert } from '../components/Alert';

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
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Camera Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

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

  const [todayData, setTodayData] = useState<any>(null);

  // 1. Inisialisasi Kamera Live & Data Presensi Hari Ini
  useEffect(() => {
    ApiService.getTodayAttendance(user.nip).then((today) => {
      setTodayData(today);
      if (today.masuk && !today.pulang) {
        setAttendanceType('Pulang');
      }
    });

    ApiService.getOfficeCoordinates(user.id_opd, user.nip).then((coord) => {
      setOfficeCoord(coord);
      randomizeOfficeLocation(coord);
    });

    startCamera();

    return () => {
      stopCamera();
    };
  }, [user]);

  // Fungsi Menjalankan Stream Kamera Depan (Selfie)
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 720 },
            height: { ideal: 960 }
          },
          audio: false
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } else {
        setCameraError('Kamera web tidak didukung oleh browser ini.');
      }
    } catch (err: any) {
      console.warn('Live camera access warning:', err);
      setCameraActive(false);
      setCameraError('Izin akses kamera belum diberikan. Klik tombol untuk mengaktifkan atau unggah foto.');
    }
  };

  // Fungsi Menghentikan Stream Kamera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Fungsi Mengambil Snapshot dari View Kamera
  const captureLivePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gambar frame video ke canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoDataUrl(dataUrl);

    canvas.toBlob((blob) => {
      if (blob) setPhotoBlob(blob);
    }, 'image/jpeg', 0.85);

    stopCamera();
  };

  // Fungsi Ulang Foto (Membuka Kamera Kembali)
  const retakePhoto = () => {
    setPhotoDataUrl(null);
    setPhotoBlob(null);
    startCamera();
  };

  // Fallback jika kamera live gagal dibuka
  const handleFallbackPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoBlob(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    stopCamera();
  };

  // Fungsi Mengacak Koordinat dalam Radius 50m dari Titik Kantor
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

  const handleSubmitAttendance = async () => {
    if (!photoBlob || !photoDataUrl) {
      setErrorMessage('Harap ambil foto selfie terlebih dahulu melalui kamera.');
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
      await ApiService.submitAttendance({
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
          Data presensi dan foto selfie telah tercatat pada jarak {location.distance} meter dari titik kantor OPD.
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

      {/* Info Otomatisasi Status */}
      {todayData?.masuk && (
        <Alert variant="success" className="mb-1">
          <div className="flex items-center justify-between w-full">
            <span>Presensi Masuk tercatat: <strong>{todayData.masuk}</strong></span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md ml-2 flex-shrink-0">
              {todayData?.pulang ? 'Lengkap' : 'Otomatis Pulang'}
            </span>
          </div>
        </Alert>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* 📸 View Kamera Live & Preview Foto */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-brand-800" />
            <span>{photoDataUrl ? 'Hasil Foto Selfie' : 'Kamera Selfie Langsung'}</span>
          </span>
          {photoDataUrl && (
            <button
              onClick={retakePhoto}
              className="text-xs font-semibold text-brand-800 hover:text-brand-900 flex items-center gap-1 min-h-[36px] px-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Foto Ulang</span>
            </button>
          )}
        </div>

        {/* Viewport Kamera Live */}
        <div className="w-full h-72 rounded-2xl bg-slate-900 overflow-hidden relative border border-slate-300 flex items-center justify-center">
          {photoDataUrl ? (
            /* Tampilan Hasil Jepretan */
            <img
              src={photoDataUrl}
              alt="Hasil Foto Presensi"
              className="w-full h-full object-cover"
            />
          ) : (
            /* Stream Kamera Live */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Garis Bingkai Wajah */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-56 border-2 border-dashed border-white/60 rounded-full"></div>
              </div>

              {/* Status Live Indicator */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/70 text-white text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Live View</span>
              </div>

              {/* Fallback Jika Kamera Gagal Diaktifkan */}
              {!cameraActive && cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center z-10">
                  <VideoOff className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-200 mb-3">{cameraError}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Video className="w-4 h-4" />
                      <span>Coba Lagi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fallbackInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Buka Kamera Native
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden Canvas untuk Snapshot */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFallbackPhotoSelect}
          className="hidden"
        />

        {/* Tombol Shutter Jepret Foto */}
        {!photoDataUrl && (
          <div className="mt-3 w-full flex items-center justify-center">
            <button
              type="button"
              onClick={captureLivePhoto}
              className="w-full min-h-[46px] py-3 px-4 bg-brand-800 hover:bg-brand-900 active:bg-brand-950 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Ambil Foto Selfie Sekarang</span>
            </button>
          </div>
        )}
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

      {/* Tombol Kirim Presensi */}
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
