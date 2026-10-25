<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\StudyPlan;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        StudyPlan::updateOrCreate(
            ['student_nim' => '202601001'],
            [
                'student_name' => 'Budi Santoso',
                'prodi' => 'S1 Teknik Informatika',
                'semester' => 'Ganjil 2026/2027',
                'max_sks' => 24,
                'status' => 'draft',
                'submitted_at' => null,
            ]
        );

        $courses = [
            [
                'kode' => 'IF2101',
                'nama' => 'Pemrograman Web Fullstack',
                'sks' => 4,
                'semester' => 3,
                'dosen' => 'Dr. Budi Raharjo, M.Kom.',
                'jadwal' => 'Senin, 08:00 - 11:20',
                'ruangan' => 'Lab Terpadu A-201',
            ],
            [
                'kode' => 'IF2102',
                'nama' => 'Struktur Data & Algoritma Lanjut',
                'sks' => 4,
                'semester' => 3,
                'dosen' => 'Prof. Dr. Rinaldi Munir, M.T.',
                'jadwal' => 'Senin, 13:00 - 16:20',
                'ruangan' => 'Gedung D-302',
            ],
            [
                'kode' => 'IF2103',
                'nama' => 'Sistem Basis Data Relasional',
                'sks' => 3,
                'semester' => 3,
                'dosen' => 'Ir. Siti Aminah, M.Sc.',
                'jadwal' => 'Selasa, 08:00 - 10:30',
                'ruangan' => 'Lab Basis Data B-104',
            ],
            [
                'kode' => 'IF2104',
                'nama' => 'Kecerdasan Buatan & Machine Learning',
                'sks' => 4,
                'semester' => 5,
                'dosen' => 'Dr. Andi Wijaya, S.Kom., M.Cs.',
                'jadwal' => 'Selasa, 13:00 - 16:20',
                'ruangan' => 'Lab AI C-301',
            ],
            [
                'kode' => 'IF2105',
                'nama' => 'Rekayasa Perangkat Lunak Berbasis AI',
                'sks' => 3,
                'semester' => 5,
                'dosen' => 'Dr. Hendra Pratama, M.T.',
                'jadwal' => 'Rabu, 08:00 - 10:30',
                'ruangan' => 'Gedung D-205',
            ],
            [
                'kode' => 'IF2106',
                'nama' => 'Jaringan Komputer & Keamanan Siber',
                'sks' => 3,
                'semester' => 3,
                'dosen' => 'Dewi Sartika, S.T., M.Kom.',
                'jadwal' => 'Rabu, 13:00 - 15:30',
                'ruangan' => 'Lab Jaringan B-202',
            ],
            [
                'kode' => 'IF2107',
                'nama' => 'Sistem Operasi & Komputasi Awan',
                'sks' => 3,
                'semester' => 3,
                'dosen' => 'Fajar Nugroho, S.Kom., M.T.',
                'jadwal' => 'Kamis, 08:00 - 10:30',
                'ruangan' => 'Gedung D-101',
            ],
            [
                'kode' => 'IF2108',
                'nama' => 'Desain Antarmuka & Pengalaman Pengguna (UI/UX)',
                'sks' => 3,
                'semester' => 5,
                'dosen' => 'Nadia Putri, S.Ds., M.Kom.',
                'jadwal' => 'Kamis, 13:00 - 15:30',
                'ruangan' => 'Studio Multimedia C-102',
            ],
            [
                'kode' => 'IF2109',
                'nama' => 'Pengembangan Aplikasi Perangkat Bergerak',
                'sks' => 3,
                'semester' => 5,
                'dosen' => 'Rizky Ramadhan, S.Kom., M.Cs.',
                'jadwal' => 'Jumat, 08:00 - 10:30',
                'ruangan' => 'Lab Mobile A-204',
            ],
            [
                'kode' => 'IF2110',
                'nama' => 'Matematika Diskrit & Logika Informatika',
                'sks' => 3,
                'semester' => 3,
                'dosen' => 'Dra. Ratna Sari, M.Si.',
                'jadwal' => 'Jumat, 13:30 - 16:00',
                'ruangan' => 'Gedung D-304',
            ],
            [
                'kode' => 'IF2111',
                'nama' => 'Arsitektur Microservices & DevOps',
                'sks' => 3,
                'semester' => 5,
                'dosen' => 'Arif Budiman, S.T., M.Eng.',
                'jadwal' => 'Senin, 15:30 - 18:00',
                'ruangan' => 'Lab Cloud C-203',
            ],
            [
                'kode' => 'IF2112',
                'nama' => 'Metodologi Penelitian & Penulisan Ilmiah',
                'sks' => 2,
                'semester' => 5,
                'dosen' => 'Dr. Lestari Handayani, M.Kom.',
                'jadwal' => 'Selasa, 10:40 - 12:20',
                'ruangan' => 'Gedung D-105',
            ],
            [
                'kode' => 'IF2113',
                'nama' => 'Etika Profesi & Hukum Teknologi Informasi',
                'sks' => 2,
                'semester' => 5,
                'dosen' => 'Drs. Bambang Sudibyo, M.H.',
                'jadwal' => 'Rabu, 10:40 - 12:20',
                'ruangan' => 'Gedung D-108',
            ],
            [
                'kode' => 'IF2114',
                'nama' => 'Kewirausahaan Digital & Startup Teknologi',
                'sks' => 2,
                'semester' => 5,
                'dosen' => 'Dimas Anggara, S.E., M.B.A.',
                'jadwal' => 'Kamis, 10:40 - 12:20',
                'ruangan' => 'Aula Bisnis E-101',
            ],
        ];

        foreach ($courses as $course) {
            Course::updateOrCreate(
                ['kode' => $course['kode']],
                $course
            );
        }
    }
}
