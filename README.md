<!-- @format -->

# Little Love Archive

Database sekarang memakai pola yang sama seperti project `Love`: Supabase menyimpan satu object JSON di tabel `love_content`, sedangkan foto dan audio disimpan di bucket Storage `love-media`.

## Setup satu kali

F6mkdhJerudg7AjJ

1. Buka Supabase Dashboard project kamu.
2. Masuk ke **SQL Editor**.
3. Jalankan seluruh isi [supabase-setup.sql](supabase-setup.sql).
4. Pastikan public URL dan publishable/anon key ada di [js/supabase-config.js](js/supabase-config.js).
5. Deploy ulang ke Vercel.
6. Buka `/config.html`, edit isi archive, lalu klik **Simpan semua perubahan**.

Tidak perlu lagi mengatur `ARCHIVE_ADMIN_KEY` atau endpoint Redis untuk alur utama ini. Supabase anon/publishable key memang boleh berada di browser; keamanan akses diatur oleh Row Level Security dan policy SQL.

<!-- @format -->

# Little Love Archive

Static scrapbook site with a protected Vercel serverless save endpoint.

## Local environment

`.env.local.example` tersedia untuk server tooling/local Vercel. Namun website HTML statis tidak dapat membaca `.env.local` langsung dari browser. Untuk halaman statis, gunakan [js/supabase-config.js](js/supabase-config.js) berisi URL project dan publishable/anon key.

## Media

Gunakan bagian **media room** di `/config.html` untuk upload foto hero, foto momen, dan audio. File akan masuk ke Supabase Storage dan URL publiknya disimpan di object archive.

## Backup

Export/import JSON tetap tersedia sebagai cadangan manual. Data lintas-device utama berasal dari Supabase.
