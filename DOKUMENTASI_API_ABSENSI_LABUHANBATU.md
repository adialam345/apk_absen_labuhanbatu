# Dokumentasi Lengkap REST API Absensi Online Labuhanbatu (OLA v2.0.1)

## 📌 Ringkasan Sistem
* **Nama Aplikasi**: Absensi Online Labuhanbatu (OLA)
* **Package Name**: `ola.labuhanbatukab.go.id`
* **Versi APK**: 2.0.1 (Build 20)
* **Framework**: Flutter (Dart AOT Native)
* **Base URL**: `http://ola.labuhanbatukab.go.id/api`
* **Protokol**: HTTP (Cleartext)
* **Mekanisme Sesi**: Stateful Parameter-based (`nip` & `id_opd` via local `shared_preferences`)

---

## 📑 Daftar Seluruh Endpoint

| No | Endpoint | Method | Content-Type | Deskripsi |
|:---|:---|:---:|:---|:---|
| 1 | `/api/auth` | `POST` | `application/x-www-form-urlencoded` | Autentikasi / Login akun pegawai |
| 2 | `/api/registerabsen` | `POST` | `multipart/form-data` | Submit presensi masuk/pulang + GPS + Foto |
| 3 | `/api/koordinat` | `POST` / `GET` | `application/x-www-form-urlencoded` | Titik koordinat & radius kantor |
| 4 | `/api/absenTodday` | `POST` / `GET` | `application/x-www-form-urlencoded` | Status absensi hari berjalan |
| 5 | `/api/daftarAbsen` | `POST` / `GET` | `application/x-www-form-urlencoded` | Riwayat rekap kehadiran |
| 6 | `/api/jadwal` | `POST` / `GET` | `application/x-www-form-urlencoded` | Jadwal jam kerja pegawai |
| 7 | `/api/updateprofil` | `POST` | `multipart/form-data` | Update foto profil pegawai |
| 8 | `/api/chagePass` | `POST` | `application/x-www-form-urlencoded` | Ganti kata sandi akun |

---

## 🛠️ Rincian Detail Setiap Endpoint

### 1. Autentikasi / Login Pegawai
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/auth`
* **Method**: `POST`
* **Content-Type**: `application/x-www-form-urlencoded` atau `multipart/form-data`
* **Fungsi**: Memvalidasi NIP dan password pegawai saat masuk ke aplikasi.

#### Request Body
| Parameter | Tipe | Wajib | Keterangan | Contoh |
|:---|:---:|:---:|:---|:---|
| `nip` | String | Ya | NIP pegawai | `198501012010011001` |
| `password` | String | Ya | Password akun | `password123` |

#### Format Response
```json
{
  "status": true,
  "message": "Login berhasil",
  "data": {
    "nip": "198501012010011001",
    "nama": "Ahmad Fauzi",
    "id_opd": "12",
    "opd": "DINAS KOMUNIKASI DAN INFORMATIKA",
    "foto": "198501012010011001.jpg"
  }
}
```

---

### 2. Submit Presensi (Masuk / Pulang)
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/registerabsen`
* **Method**: `POST`
* **Content-Type**: `multipart/form-data`
* **Fungsi**: Merekam kehadiran dengan menyertakan lokasi latitude/longitude, kalkulasi jarak geofence, dan file foto kamera.

#### Request Body (Multipart / Form-Data)
| Parameter | Tipe | Wajib | Keterangan | Contoh |
|:---|:---:|:---:|:---|:---|
| `nip` | String | Ya | NIP Pegawai | `198501012010011001` |
| `latitude` | String/Float | Ya | Titik latitude GPS saat absen | `2.095431` |
| `longitude` | String/Float | Ya | Titik longitude GPS saat absen | `99.823412` |
| `jarak` | String/Float | Ya | Jarak pengguna ke kantor (meter) | `15.4` |
| `stsLokasi` | String | Ya | Status radius (`Di Wilayah Kantor` / `Diluar wilayah kantor`) | `Di Wilayah Kantor` |
| `waktu_absen` | String | Ya | Jam presensi direkam | `07:45:12` |
| `status` | String | Ya | Jenis presensi (`Masuk` atau `Pulang`) | `Masuk` |
| `foto` | File (Binary) | Ya | Berkas gambar selfie kamera langsung | `selfie.jpg` |

#### Format Response
```json
{
  "status": true,
  "message": "Absen tersimpan"
}
```

---

### 3. Titik Koordinat & Radius Kantor
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/koordinat`
* **Method**: `POST` / `GET`
* **Content-Type**: `application/x-www-form-urlencoded`
* **Fungsi**: Mengambil titik koordinat kantor dan radius izin absensi berdasarkan instansi/OPD.

#### Request Body / Query Params
| Parameter | Tipe | Wajib | Keterangan |
|:---|:---:|:---:|:---|
| `id_opd` | String/Int | Ya | ID Satuan Kerja / OPD |
| `nip` | String | Opsional | NIP Pegawai |

#### Format Response
```json
{
  "status": true,
  "data": {
    "id_opd": "12",
    "nama_opd": "DINAS KOMUNIKASI DAN INFORMATIKA",
    "latitude": "2.095500",
    "longitude": "99.823500",
    "radius": "100"
  }
}
```

---

### 4. Status Presensi Hari Ini
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/absenTodday`
* **Method**: `POST` / `GET`
* **Content-Type**: `application/x-www-form-urlencoded`
* **Fungsi**: Mengambil informasi kehadiran pegawai pada tanggal hari ini.

#### Request Body / Query Params
| Parameter | Tipe | Wajib | Keterangan | Contoh |
|:---|:---:|:---:|:---|:---|
| `nip` | String | Ya | NIP Pegawai | `198501012010011001` |
| `tgl` | String | Opsional | Tanggal (YYYY-MM-DD) | `2026-10-02` |

#### Format Response
```json
{
  "status": true,
  "data": {
    "tanggal": "2026-10-02",
    "masuk": "07:45:10",
    "pulang": "16:30:22",
    "status_masuk": "Hadir",
    "status_pulang": "Hadir",
    "keterangan": "Tepat Waktu"
  }
}
```

---

### 5. Riwayat / Daftar Rekap Kehadiran
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/daftarAbsen`
* **Method**: `POST` / `GET`
* **Content-Type**: `application/x-www-form-urlencoded`
* **Fungsi**: Menampilkan riwayat rekap presensi seluruh hari kerja.

#### Request Body / Query Params
| Parameter | Tipe | Wajib | Keterangan |
|:---|:---:|:---:|:---|
| `nip` | String | Ya | NIP Pegawai |

#### Format Response
```json
{
  "status": true,
  "data": [
    {
      "id_absen": "10521",
      "tanggal": "2026-10-01",
      "jam_masuk": "07:40:15",
      "jam_pulang": "16:35:10",
      "status": "Hadir",
      "sts_lokasi": "Di Wilayah Kantor",
      "foto_masuk": "198501012010011001_20261001_masuk.jpg",
      "foto_pulang": "198501012010011001_20261001_pulang.jpg"
    }
  ]
}
```

---

### 6. Master Jadwal Kerja Pegawai
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/jadwal`
* **Method**: `POST` / `GET`
* **Content-Type**: `application/x-www-form-urlencoded`
* **Fungsi**: Mengambil aturan shift jam masuk dan jam pulang sesuai dinas/OPD.

#### Request Body / Query Params
| Parameter | Tipe | Wajib | Keterangan |
|:---|:---:|:---:|:---|
| `id_opd` | String/Int | Ya | ID Satuan Kerja / OPD |
| `nip` | String | Opsional | NIP Pegawai |

#### Format Response
```json
{
  "status": true,
  "data": [
    {
      "hari": "Senin",
      "jam_mulai_masuk": "06:30:00",
      "jam_akhir_masuk": "08:00:00",
      "jam_mulai_pulang": "16:00:00",
      "jam_akhir_pulang": "18:00:00"
    }
  ]
}
```

---

### 7. Pembaruan Foto Profil
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/updateprofil`
* **Method**: `POST`
* **Content-Type**: `multipart/form-data`
* **Fungsi**: Mengunggah berkas foto profil baru pegawai ke server.

#### Request Body (Multipart / Form-Data)
| Parameter | Tipe | Wajib | Keterangan |
|:---|:---:|:---:|:---|
| `nip` | String | Ya | NIP Pegawai |
| `foto` / `img` | File (Binary) | Ya | Berkas foto baru (`.jpg` / `.png`) |

#### Format Response
```json
{
  "status": true,
  "message": "Foto tersimpan"
}
```

---

### 8. Ganti Kata Sandi Akun
* **Endpoint**: `http://ola.labuhanbatukab.go.id/api/chagePass`
* **Method**: `POST`
* **Content-Type**: `application/x-www-form-urlencoded`
* **Fungsi**: Mengubah kata sandi akun pengguna.

#### Request Body
| Parameter | Tipe | Wajib | Keterangan |
|:---|:---:|:---:|:---|
| `nip` | String | Ya | NIP Pegawai |
| `password` | String | Ya | Password lama |
| `passwordNew` | String | Ya | Password baru yang diinginkan |

#### Format Response
```json
{
  "status": true,
  "message": "Password tersimpan"
}
```

---

## 🌐 Direktori Media & Aset Statis

* **Foto Profil Pengguna**: `http://ola.labuhanbatukab.go.id/assets/img/user/{nama_file}`
* **Banner Pengumuman / Info**: `http://ola.labuhanbatukab.go.id/assets/img/notice/{nama_file}`
