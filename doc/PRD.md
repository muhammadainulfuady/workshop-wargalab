# Product Requirements Document (PRD): Mini KRS Mahasiswa

## 1. Ringkasan Proyek
Aplikasi **Mini KRS (Kartu Rencana Studi) Mahasiswa** dirancang khusus untuk kebutuhan demo seminar *AI-Assisted Fullstack Development*. Aplikasi ini mensimulasikan alur pengisian KRS untuk **satu mahasiswa tunggal** (tanpa sistem autentikasi/login) dengan fokus pada kesederhanaan arsitektur, kecepatan pengembangan, dan kejelasan alur data *frontend-to-backend*.

### Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS (`frontend/`)
- **Backend:** Laravel 13 RESTful API (`backend/`)
- **Database:** SQLite (`backend/database/database.sqlite`)

---

## 2. Fitur Utama (Scope)
1. **Profil Mahasiswa Statis/Tunggal:** Menampilkan informasi satu mahasiswa demo (Nama, NIM, Prodi, Semester, Batas Maksimal 24 SKS) beserta status pengajuan KRS saat ini (`Draft` atau `Diajukan`).
2. **Daftar Mata Kuliah Tersedia (Katalog):** Menampilkan minimal 12 mata kuliah yang ditawarkan beserta kode, nama, jumlah SKS, semester, dosen pengampu, jadwal, ruangan, dan status apakah sudah diambil di KRS.
3. **Tambah & Hapus Mata Kuliah KRS:** Mahasiswa dapat menambahkan mata kuliah dari katalog ke daftar KRS atau menghapusnya selama status pengajuan masih `draft`.
4. **Validasi Bisnis Wajib di Backend:**
   - **Anti-Duplikat:** Tidak boleh mengambil mata kuliah yang sama lebih dari satu kali.
   - **Batas Maksimal 24 SKS:** Menolak penambahan mata kuliah apabila total SKS melebihi 24 SKS.
   - **Kunci Status Pengajuan:** Tidak boleh menambah atau menghapus mata kuliah setelah KRS diajukan (`submitted`).
   - **Transaksi Database:** Operasi mutasi data menggunakan `DB::transaction`.
5. **Simpan ke Database & Pengajuan KRS:**
   - Seluruh perubahan langsung tersimpan ke database SQLite.
   - Tombol **"Ajukan KRS Sekarang"** mengubah status pengajuan dari `draft` menjadi `submitted` (mengunci perubahan KRS).

---

## 3. Acceptance Criteria (Kriteria Penerimaan)

### AC-1: Menampilkan Katalog & KRS Aktif
- [x] Saat halaman dibuka, aplikasi memanggil `GET /api/mata-kuliah` dan `GET /api/krs` (tanpa mock data di frontend).
- [x] Menampilkan indikator progres SKS saat ini (`total_sks / 24 SKS`) dan badge status KRS (`Draft` atau `Diajukan`).

### AC-2: Menambahkan Mata Kuliah ke KRS (`POST /api/krs`)
- [x] Pengguna dapat menekan tombol **"+ Ambil"** pada mata kuliah di katalog.
- [x] Mata kuliah yang sudah ada di KRS ditolak jika dikirim ulang ke backend (HTTP `422`).
- [x] Jika penambahan mata kuliah membuat total SKS > 24, backend menolak request dengan HTTP `422` dan frontend menampilkan pesan error yang jelas.

### AC-3: Menghapus Mata Kuliah dari KRS (`DELETE /api/krs/:id`)
- [x] Pengguna dapat menekan tombol **"Hapus"** pada daftar mata kuliah di panel KRS.
- [x] Total SKS otomatis berkurang dan status tombol mata kuliah terkait di katalog kembali aktif.

### AC-4: Status Pengajuan KRS (`POST /api/krs/ajukan`)
- [x] Pengguna hanya bisa mengajukan KRS jika minimal ada 1 mata kuliah yang dipilih (`total_sks > 0`).
- [x] Saat status berubah menjadi `submitted`, seluruh aksi tambah/hapus dikunci baik di UI maupun di validasi backend.

---

## 4. Struktur Data (Database Schema - SQLite)

### 4.1. Tabel `study_plans` (Header KRS Mahasiswa Demo)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `INTEGER PK` | Primary Key |
| `student_nim` | `VARCHAR(20)` | NIM Mahasiswa demo (`"202601001"`) |
| `student_name` | `VARCHAR(100)` | Nama Mahasiswa demo (`"Budi Santoso"`) |
| `prodi` | `VARCHAR(100)` | Program Studi (`"S1 Teknik Informatika"`) |
| `semester` | `VARCHAR(30)` | Semester Aktif (`"Ganjil 2026/2027"`) |
| `max_sks` | `INTEGER` | Default: `24` |
| `status` | `VARCHAR(20)` | `'draft'` atau `'submitted'` |
| `submitted_at` | `TIMESTAMP NULL` | Waktu pengajuan KRS |
| `created_at` | `TIMESTAMP` | Timestamp pembuatan |
| `updated_at` | `TIMESTAMP` | Timestamp pembaruan |

### 4.2. Tabel `courses` (Master Mata Kuliah - Minimal 12 Mata Kuliah)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `INTEGER PK` | Primary Key |
| `kode` | `VARCHAR(15) UNIQUE` | Kode MK (contoh: `"IF2101"`) |
| `nama` | `VARCHAR(120)` | Nama Mata Kuliah |
| `sks` | `INTEGER` | Bobot SKS (`2`, `3`, atau `4`) |
| `semester` | `INTEGER` | Semester rekomendasi |
| `dosen` | `VARCHAR(100)` | Nama Dosen Pengampu |
| `jadwal` | `VARCHAR(60)` | Jadwal kuliah |
| `ruangan` | `VARCHAR(50)` | Ruang kelas / laboratorium |
| `created_at` | `TIMESTAMP` | Timestamp pembuatan |
| `updated_at` | `TIMESTAMP` | Timestamp pembaruan |

### 4.3. Tabel `study_plan_items` (Detail Item KRS)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `INTEGER PK` | Primary Key |
| `study_plan_id` | `FOREIGN KEY` | Referensi ke `study_plans.id` |
| `course_id` | `FOREIGN KEY` | Referensi ke `courses.id` (Unique bersama `study_plan_id`) |
| `created_at` | `TIMESTAMP` | Timestamp pembuatan |
| `updated_at` | `TIMESTAMP` | Timestamp pembaruan |

---

## 5. Spesifikasi REST API (Laravel 13)

1. **`GET /api/mata-kuliah`** — Mengambil seluruh katalog mata kuliah yang tersedia di database.
2. **`GET /api/krs`** — Mengambil data profil mahasiswa demo, daftar mata kuliah yang sudah diambil di KRS, `total_sks`, `max_sks`, dan `status` pengajuan.
3. **`POST /api/krs`** — Menambahkan mata kuliah ke KRS (`body: { "mata_kuliah_id": 1 }`) dengan validasi duplikat, maksimal 24 SKS, dan status belum diajukan.
4. **`DELETE /api/krs/:id`** — Menghapus item dari KRS berdasarkan ID item KRS (atau ID mata kuliah) jika status masih `draft`.
5. **`POST /api/krs/ajukan`** — Mengajukan dan mengunci KRS (`status = 'submitted'`).
6. **`POST /api/krs/batal-ajukan`** — Utilitas demo untuk mengembalikan status KRS ke `draft`.

---

## 6. Urutan Implementasi
1. Setup Backend Laravel 13 & SQLite (`backend/`).
2. Pembuatan Migrasi, Model, dan Seeder (14 Mata Kuliah & 1 Profil KRS Mahasiswa).
3. Implementasi Controller API & Validasi Bisnis dengan `DB::transaction`.
4. Setup Frontend React + Vite + Tailwind CSS (`frontend/`).
5. Integrasi Dashboard Responsif, Loading State, dan Error Handling.
6. Pengujian Build & End-to-End API.
