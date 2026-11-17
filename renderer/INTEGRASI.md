# Dipakai bersama TGV Produk Motion

Pertahankan skill TGV Produk Motion asli sebagai panduan pengarahan visual. Gunakan paket ini khusus ketika masukan sudah berupa kode Canvas `s, ctx`. Tidak perlu mengubahnya menjadi SVG.

Alur untuk AI yang menjalankan tugas:

1. Baca kode yang diberikan. Pisahkan instruksi/narasi dari kode JavaScript yang benar-benar akan dieksekusi. Kumpulkan DUNIA sekali dan semua scene yang diminta. Gunakan penanda persis dalam PANDUAN.md.
2. Pertahankan naskah final dan seluruh timing yang tersedia. Susun manifest JSON berisi nomor scene, durasi, tema, kata dan waktunya, serta path audio. Jangan menebak durasi bagian yang tidak diberikan dan menyebutnya sinkron.
3. Cocokkan API yang dipakai dengan cakupan runtime. Jangan membuang pemanggilan yang belum didukung atau menggantinya dengan fungsi kosong. Tambahkan implementasi dan uji jika tugas mengharuskannya; jika belum bisa, laporkan fungsi yang kurang.
4. Jalankan pemeriksaan `node scripts/render.cjs project.json --check --stills --out output/video.mp4`. Periksa frame awal/tengah/akhir tiap scene; untuk masalah di antara sampel, ambil frame pada waktunya melalui fungsi `renderFrame` yang diekspor `project.cjs`.
5. Bila pengguna memberi izin memperbaiki kode, perbaiki error tanpa menulis ulang DUNIA secara sembarang. Catat perubahan sumber. Jangan mengubah narasi final.
6. Render `node scripts/render.cjs project.json --out output/video.mp4 --width 1080 --height 1920`. Proses ini menghasilkan frame asli, bukan screen recording. Untuk landscape tentukan resolusi sesuai ukuran logis.
7. Ambil beberapa frame dari MP4 final, periksa keterbacaan HP, clipping, fokus, sambungan scene, dan kesinambungan akhir ke awal jika diminta loop. Baca laporan teknis. Jangan mengklaim telah mendengar audio jika hanya memeriksa stream.
8. Berikan MP4 serta proyek sumber yang memuat manifest, kode, runtime, dan audio yang memang digunakan. Bila VO belum tersedia, labeli sebagai pratinjau tanpa VO. Jangan mengarang file audio atau mengklaim ini video penuh jika hanya merender satu scene.

Contoh pesawat dalam paket hanya scene 12, durasi 3,14 detik. Ini adalah uji kompatibilitas kode yang sudah ada, bukan produksi ulang seluruh video pesawat. Bentuk dan tata letaknya mengikuti kode sumber. Resolusi ekspor uji 1080 × 1920; koordinat logis tetap 720 × 1280.
