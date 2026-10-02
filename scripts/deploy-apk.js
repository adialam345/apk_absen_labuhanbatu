/**
 * Script Otomatis Upload APK Baru ke Supabase Storage & Update Versi Wajib
 * 
 * Penggunaan:
 *   node scripts/deploy-apk.js --version=2.0.2 --code=21 --changelog="Perbaikan presensi GPS dan kamera"
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parameter Konfigurasi Supabase Anda
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cxhnnuizdkeywzgsxnvy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, curr) => {
  const [key, val] = curr.replace(/^--/, '').split('=');
  acc[key] = val || true;
  return acc;
}, {});

const versionName = args.version || '2.0.2';
const versionCode = parseInt(args.code || '21', 10);
const changelog = args.changelog || 'Pembaruan stabilitas dan peningkatan kecepatan presensi.';
const isMandatory = args.mandatory !== 'false';

// Lokasi file APK release dari Gradle / Capacitor
const defaultApkPath = path.resolve('./android/app/build/outputs/apk/release/app-release.apk');
const apkFilePath = args.file ? path.resolve(args.file) : defaultApkPath;

async function deployApk() {
  console.log('🚀 Memulai Proses Deploy APK ke Supabase...');
  console.log(`📌 Target Project: ${SUPABASE_URL}`);
  console.log(`📌 Versi Target: v${versionName} (VersionCode: ${versionCode})`);
  console.log(`📦 Status Update: ${isMandatory ? 'Wajib (Force Update)' : 'Opsional'}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const targetFileName = `Absensi_Labuhanbatu_v${versionName}.apk`;

  let apkPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/apk-releases/${targetFileName}`;

  // 1. Upload APK ke Storage jika file fisik ada
  if (fs.existsSync(apkFilePath)) {
    console.log(`\n1️⃣ Mengunggah ${targetFileName} ke Supabase Storage (Bucket: apk-releases)...`);
    const fileBuffer = fs.readFileSync(apkFilePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('apk-releases')
      .upload(targetFileName, fileBuffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Gagal upload APK ke Supabase Storage:', uploadError.message);
    } else {
      const { data: urlData } = supabase.storage.from('apk-releases').getPublicUrl(targetFileName);
      apkPublicUrl = urlData.publicUrl;
      console.log(`✅ Upload Berhasil! URL: ${apkPublicUrl}`);
    }
  } else {
    console.log(`ℹ️ File APK fisik di ${apkFilePath} belum ditemukan. Menggunakan link rilis: ${apkPublicUrl}`);
  }

  // 2. Insert Record ke Tabel app_versions
  console.log('\n2️⃣ Memperbarui Tabel app_versions di Database Supabase...');
  const { data: insertData, error: insertError } = await supabase
    .from('app_versions')
    .insert([
      {
        version_code: versionCode,
        version_name: versionName,
        min_version_code: isMandatory ? versionCode : 20,
        apk_url: apkPublicUrl,
        changelog: changelog,
        is_mandatory: isMandatory
      }
    ])
    .select();

  if (insertError) {
    console.error('❌ Gagal memperbarui tabel app_versions:', insertError.message);
    console.log('💡 Pastikan Anda sudah menjalankan script SUPABASE_SETUP.sql di SQL Editor Supabase.');
  } else {
    console.log('🎉 SUKSES! Versi baru telah tercatat di Supabase.');
    console.log('📲 Setiap pengguna yang membuka aplikasi sekarang akan otomatis diminta mengunduh versi baru.');
  }
}

deployApk();
