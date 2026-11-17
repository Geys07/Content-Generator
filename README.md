# REKA Studio

Editor video edukasi bahasa Indonesia dengan empat tahap: Ide, Narasi, Suara, Animasi. Menggunakan Canvas dan WebCodecs untuk preview/MP4; Remotion tidak diperlukan.

## Menjalankan

Node.js 22 atau lebih baru:

```sh
npm ci --ignore-scripts
node scripts/prepare-vendor.mjs
python3 -m http.server 8080 --directory dist
```

Buka localhost:8080. Pada hosting gunakan HTTPS. Runtime suara sekitar 21 MB disiapkan dari dependensi terkunci; model Whisper base timestamped diunduh dari Hugging Face saat sinkronisasi pertama. Audio diproses di perangkat, tanpa API key. Kata yang tidak dikenali diinterpolasi dan ditandai untuk ditinjau. Hasil pengenalan bukan jaminan ketepatan timestamp; dengarkan dan koreksi sebelum ekspor.

## Alur

1. Masukkan narasi final kosong dari awal. Pilih gaya dengan referensi gambar.
2. Salin prompt langsung, tempel hasil storyboard. Kata dan tanda baca asli harus tetap sama.
3. Unggah VO. Sinkronisasi lokal dimulai otomatis; dapat dibatalkan. Edit waktu kata melalui Tinjau timing.
4. Salin prompt animasi per kelompok, tempel kode, tinjau preview lalu ekspor MP4/SRT atau paket renderer komputer.

Pembuatan VO Gemini bersifat opsional dan membutuhkan API key akun sendiri. Key tidak disimpan dalam proyek. Penggunaan layanan dapat dikenakan biaya oleh penyedia.

## Data

Proyek otomatis tersimpan di IndexedDB perangkat. Cloud menggunakan Supabase Auth dan tabel video_projects, dengan RLS per pemilik dan bucket media privat. Masuk/buat akun melalui Proyek & berkas; penyimpanan cloud dilakukan manual. Cadangan JSON memuat audio dan gambar.

Konfigurasi publik Supabase ada di dist/cloud.js. Tidak ada service-role key di frontend. Skema server ada di supabase/schema.sql. Akun Supabase aplikasi terpisah dari akun ChatGPT.

## Pemeriksaan

```sh
npm test
node --test renderer/tests/render.test.cjs
```

Lihat QA.md untuk hasil dan batas pengujian, DESIGN.md untuk keputusan desain, serta dist/assets/styles/CREDITS.md untuk sumber gambar. Browser berbasis Chromium dengan WebCodecs direkomendasikan untuk MP4. Kemampuan dan waktu pemrosesan bergantung pada perangkat.
