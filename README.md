# Mini KRS Mahasiswa — Demo Seminar AI-Assisted Fullstack Development

Aplikasi **Mini KRS (Kartu Rencana Studi) Mahasiswa** fullstack berbasis **React + Vite + Tailwind CSS** (Frontend) dan **Laravel 13 + SQLite** (Backend REST API). Aplikasi ini dirancang untuk demonstrasi pengisian KRS satu mahasiswa tunggal (tanpa autentikasi) dengan validasi bisnis penuh di sisi backend.

---

## Fitur Utama

- **Katalog Mata Kuliah (`GET /api/mata-kuliah`):** Menampilkan 14 mata kuliah pilihan (total 42 SKS tersedia) lengkap dengan kode, nama, bobot SKS, semester, dosen pengampu, jadwal, dan ruangan.
- **Manajemen KRS Mahasiswa (`GET /api/krs`, `POST /api/krs`, `DELETE /api/krs/:id`):** Menambah dan menghapus mata kuliah secara *real-time* yang tersimpan langsung ke database SQLite.
- **Validasi Bisnis Ketat di Backend (dengan Database Transaction):**
  - **Anti-Duplikat:** Menolak penambahan mata kuliah yang sudah ada di KRS.
  - **Batas Maksimum 24 SKS:** Menolak penambahan mata kuliah jika akumulasi SKS melebihi 24 SKS.
  - **Kunci Pengajuan (`POST /api/krs/ajukan`):** Mengubah status KRS menjadi `submitted` dan menolak segala perubahan (`POST`/`DELETE`) setelah diajukan.
- **UI/UX Dashboard Responsif:** Dilengkapi indikator kuota SKS (*progress bar*), pencarian & filter SKS, *loading skeleton/spinner* di setiap aksi, serta pesan *error/success alert* yang informatif.

---

## Struktur Direktori

```text
.
├── backend/                  # Backend Laravel 13 (REST API + SQLite)
│   ├── app/
│   │   ├── Http/Controllers/Api/KrsController.php
│   │   └── Models/           # Course, StudyPlan, StudyPlanItem
│   ├── database/
│   │   ├── database.sqlite   # File database SQLite
│   │   ├── migrations/       # Migrasi tabel courses, study_plans, study_plan_items
│   │   └── seeders/          # Seeder 14 mata kuliah & 1 profil mahasiswa demo
│   └── routes/api.php        # Definisi endpoint REST API
├── frontend/                 # Frontend React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── services/api.js   # HTTP Client ke REST API Laravel
│   │   ├── App.jsx           # Komponen Dashboard Utama
│   │   └── main.jsx
│   └── vite.config.js        # Konfigurasi Vite + Proxy /api ke port 8000
├── doc/
│   └── PRD.md                # Dokumen Product Requirements Document (PRD)
├── package.json              # Root helper scripts
└── README.md
```

---

## Prasyarat Sistem

- **PHP** >= 8.3 (dengan ekstensi `pdo_sqlite` dan `sqlite3` aktif)
- **Composer** >= 2.x
- **Node.js** >= 20.x & **npm**

---

## Langkah Instalasi & Menjalankan Aplikasi

### 1. Setup & Jalankan Backend (Laravel 13 + SQLite)

Buka terminal pertama dan jalankan:

```bash
cd backend

# 1. Install dependensi PHP (jika belum)
composer install

# 2. Pastikan file .env dan database SQLite tersedia, lalu jalankan migrasi & seeder (14 Mata Kuliah)
php artisan migrate:fresh --seed

# 3. Jalankan server Laravel di port 8000
php artisan serve --host=127.0.0.1 --port=8000
```

Server API Backend akan berjalan di: `http://127.0.0.1:8000`

### 2. Setup & Jalankan Frontend (React + Vite + Tailwind CSS)

Buka terminal kedua dan jalankan:

```bash
cd frontend

# 1. Install dependensi Node.js (jika belum)
npm install

# 2. Jalankan development server Vite
npm run dev
```

Aplikasi Frontend dapat diakses melalui browser di: `http://localhost:5173`

> **Catatan:** Pada `frontend/vite.config.js`, seluruh request ke `/api/*` otomatis di-*proxy* ke `http://127.0.0.1:8000/api/*`. Anda juga dapat mengatur variabel `VITE_API_BASE_URL=http://127.0.0.1:8000/api` jika diperlukan.

---

## Daftar Package Scripts (Root Workspace)

Dari folder root proyek, Anda juga dapat menjalankan perintah pintasan berikut:

| Script | Perintah | Keterangan |
| :--- | :--- | :--- |
| `npm run setup` | Setup Backend & Frontend | Menginstal dependensi dan menjalankan migrasi + seed database |
| `npm run dev:backend` | `php artisan serve` | Menjalankan server backend Laravel di `127.0.0.1:8000` |
| `npm run dev:frontend` | `vite` | Menjalankan dev server React Vite di `localhost:5173` |
| `npm run build:frontend` | `vite build` | Memeriksa dan membangun bundle produksi frontend |
| `npm run lint:frontend` | `oxlint` | Menjalankan pemeriksaan linter pada kode frontend |
| `npm run test:backend` | `php artisan test` | Menjalankan pengujian otomatis fitur API di backend |
| `npm run db:reset` | `php artisan migrate:fresh --seed` | Mereset ulang database SQLite ke kondisi awal demo |

---

## Dokumentasi Endpoint REST API

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/mata-kuliah` | Mengambil daftar seluruh mata kuliah yang tersedia (14 mata kuliah) |
| `GET` | `/api/krs` | Mengambil data profil mahasiswa demo, daftar item KRS, total SKS, & status pengajuan |
| `POST` | `/api/krs` | Menambahkan mata kuliah ke KRS (`{ "mata_kuliah_id": 1 }`) |
| `DELETE` | `/api/krs/:id` | Menghapus item mata kuliah dari KRS berdasarkan ID item KRS |
| `POST` | `/api/krs/ajukan` | Mengajukan KRS dan mengunci perubahan (`status = submitted`) |
| `POST` | `/api/krs/batal-ajukan` | *(Utilitas Demo)* Membuka kembali kunci KRS ke status `draft` |
