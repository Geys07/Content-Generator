# Canvas Video Renderer

Paket pendamping TGV Produk Motion untuk mengubah kode Canvas `function(s, ctx)` menjadi MP4. Ini adalah renderer yang dijalankan AI di lingkungan eksekusi, bukan aplikasi Android dan bukan pengganti skill narasi. Skill asli tetap dapat dipakai untuk merancang visual; paket ini menangani eksekusi kode yang sudah selesai.

## Cara pakai dari HP

Unggah ZIP paket ini, kode DUNIA + scene, dan voiceover ke percakapan AI yang memiliki akses menjalankan kode serta FFmpeg. Tempel perintah berikut:

> Gunakan Canvas Video Renderer dalam ZIP ini untuk merender kode yang saya lampirkan. Baca PANDUAN.md dan INTEGRASI.md. Pertahankan kode DUNIA, narasi final, nomor scene, dan durasi yang saya berikan. Siapkan manifest, periksa semua scene, render MP4, lalu periksa frame dari MP4 final. Berikan MP4 dan proyek sumber. Jika ada error, sebutkan scene serta barisnya; jangan menghapus bagian yang gagal. Jangan membuat website. Jangan mengganti animasi dengan gambar diam. Jangan mengarang scene yang belum saya kirim. Jika VO tidak ada, buat pratinjau tanpa VO dan jelaskan itu.

Kemampuan menjalankan berkas bergantung pada lingkungan AI yang dipakai. Instruksi skill saja tidak memasang FFmpeg atau dependensi gambar.

## Isi paket

- `scripts/runtime.cjs`: implementasi fungsi waktu, spring, teks, grup, dan bentuk Canvas.
- `scripts/project.cjs`: membaca penanda DUNIA/SCENE, memisahkan lingkup variabel, menampilkan subtitle.
- `scripts/render.cjs`: pemeriksaan kode, rendering frame, encoding MP4 dan pencampuran audio.
- `scripts/audio.cjs`: SFX sintetis, tanpa aset audio eksternal.
- `examples/pesawat.js`: kode bersama dan scene 12 dari lampiran pengguna, tanpa perubahan geometri.
- `examples/pesawat.json`: durasi 3,14 detik, timing kata, dan opsi contoh.
- `tests/render.test.cjs`: pengujian parser, timeline, determinisme, timeout, dan ekspor audio/video.

## Menjalankan di lingkungan eksekusi

Perlu Node.js 20+, FFmpeg dengan encoder libx264/AAC, ffprobe, dan `@napi-rs/canvas`. Jika dependensi tersedia di runtime Codex, skrip mendeteksinya. Jika belum, dari folder paket jalankan:

```sh
npm install
node scripts/render.cjs examples/pesawat.json --check --stills --out output/pesawat.mp4
node scripts/render.cjs examples/pesawat.json --out output/pesawat.mp4 --width 1080 --height 1920
```

Tidak memerlukan Chromium, perekaman layar, Remotion, API AI, atau server. Frame dibuat berdasarkan waktu pasti `frame / fps` lalu dikirim ke FFmpeg. Kecepatan render bergantung pada kerumitan kode dan mesin yang digunakan.

Output yang sudah ada dilindungi. Pakai nama baru atau tambahkan `--overwrite` jika memang ingin menggantinya.

## Format kode

Simpan kode saja dalam `.js`, tanpa pagar Markdown dan tanpa seluruh teks prompt:

```js
// ===== DUNIA =====
const warna = "#3b5bdb";
// ===== AKHIR DUNIA =====

// ===== SCENE 1 =====
const k = s.spring(0, "smooth");
s.circle(360, s.lerp(520, 420, k), 80, { fill: warna });
s.sfx("click", 0.3, 0.2);

// ===== SCENE 2 =====
const k = s.spring(0, "smooth");
s.circle(s.lerp(360, 460, k), 420, 80, { fill: warna });
```

Nomor boleh dimulai dari scene berapa pun. DUNIA hanya sekali. Tiap scene mempunyai lingkup lokal sendiri, sehingga nama `const cam` dapat dipakai berulang. Jika tidak ada kode bersama, bagian DUNIA dapat dihilangkan. Semua scene dalam sumber harus tercantum di manifest; nomor duplikat ditolak.

## Manifest

Buat JSON di samping berkas kode:

```json
{
  "source": "scenes.js",
  "width": 1080,
  "height": 1920,
  "logicalWidth": 720,
  "logicalHeight": 1280,
  "fps": 30,
  "font": "DejaVu Sans",
  "captionY": 850,
  "captionSize": 30,
  "scenes": [
    {"id": 1, "duration": 2, "theme": "paper"},
    {"id": 2, "duration": 2, "theme": "paper"}
  ],
  "audio": {"sfx": true}
}
```

`logicalWidth` dan `logicalHeight` adalah koordinat asli kode. Resolusi ekspor tidak mengubah komposisi. Untuk kode landscape, isi ukuran logis dan output sesuai kontraknya. Jangan mengubah rasio output terhadap ukuran logis jika ingin menghindari distorsi.

Untuk subtitle, isi `caption` per scene. Jika ada timing kata, gunakan `words` berisi `{"text":"Kata", "start":0.3}`; waktu relatif terhadap awal scene. Maksimal dua baris ditampilkan per halaman. Kata yang belum diucapkan berwarna abu. Tanpa timing, subtitle ditampilkan statis; renderer tidak mengaku menyelaraskannya dengan suara.

Untuk audio, tambahkan:

```json
"audio": {
  "voiceover": "narasi.mp3",
  "voiceoverGain": 1,
  "music": "musik.wav",
  "musicGain": 0.08,
  "sfx": true
}
```

Path relatif terhadap manifest. Musik diulang sepanjang timeline. VO yang terlalu panjang ditolak agar narasi tidak terpotong diam-diam; sesuaikan durasi scene. VO yang lebih pendek dilengkapi keheningan sampai akhir. SFX dijadwalkan dari panggilan `s.sfx` saat pemeriksaan awal masing-masing scene; panggil di level atas, tanpa kondisi waktu. Nama SFX dalam kontrak dipetakan ke bunyi sintetis per kategori; bukan rekaman objek asli.

## Cakupan versi ini

Berhasil menjalankan contoh pesawat yang memakai proyeksi 3D sendiri (`world`, `P`, `quad`, `box`, `ring`, `pipe`, `flush`) melalui Canvas mentah. Helper DUNIA tersebut dibaca dari kode pengguna, bukan diganti oleh renderer.

API yang disediakan:

- `t`, `dur`, `p`, `theme`, `c`, `rand`, `wave`, `lerp`, `clamp`.
- `spring`, `stagger`, `keys`, `at`, `pop`, dan easing dalam kontrak.
- `group`, `rect`, `circle`, `ellipse`, `arc`, `line`, `polyline`, `shape`, `curve`, `dash`.
- `text`, `text3d`, `words`, `tag`, `card`, `shadow`, `ground`.
- `check`, `cross`, `sparkle`, `rays`, `burst`, `sfx`.

Batas kompatibilitas:

- `s.box`, `s.cylinder`, `s.extrude`, `s.isoBox`, `s.shapes` dan helper 3D engine lainnya belum disediakan. Ini berbeda dari `box`, `ring`, dll. yang sudah didefinisikan dalam DUNIA pesawat. API yang belum ada menghentikan render dengan pesan jelas.
- Font, parameter spring preset, bayangan, dan SFX merupakan implementasi pengganti, sehingga tidak dijanjikan identik piksel dengan engine asli.
- `text3d` memakai lapisan teks untuk kedalaman; frame `pill`, `box`, `circle` tersedia. Bentuk frame lain belum didukung.
- Gaya bersih: `wobble`, `hatch`, dan pena cahaya tidak diimplementasikan. Garis/kurva dan isian tetap digambar tanpa coretan.
- Tidak ada transisi atau gerakan kamera otomatis. Kamera berasal dari kode scene; latar dan subtitle berasal dari renderer.
- Tidak membuat VO, musik, naskah atau timing kata otomatis. Berkas audio dan timing berasal dari pengguna atau proses produksi terpisah.

## Pemeriksaan dan keterbatasan

```sh
node --test tests/*.test.cjs
```

`--check` memeriksa sintaks dan menjalankan awal, tengah, serta akhir setiap scene. Ekspor menjalankan seluruh frame. Kesalahan menampilkan scene, waktu, dan baris berkas sumber. Frame yang tidak selesai dalam 1,5 detik dihentikan; batas dapat diatur `--timeout 3000`. Jalankan hanya kode milik sendiri/tepercaya: Node VM ini bukan sandbox keamanan untuk menerima kode publik.

Durasi ekspor dibulatkan ke atas ke frame utuh, selisih kurang dari satu frame. Laporan `.report.json` mencatat durasi asli, durasi video, jumlah frame, codec, dan SFX. Pemeriksaan teknis tidak menggantikan penilaian visual atau mendengarkan audio. Renderer tidak memperbaiki otomatis bagian pesawat yang salah, teks bertumpuk, atau sambungan kamera yang tidak cocok.
