<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\StudyPlan;
use App\Models\StudyPlanItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KrsController extends Controller
{
    /**
     * GET /api/mata-kuliah
     * Mengambil daftar seluruh mata kuliah yang tersedia.
     */
    public function mataKuliah(): JsonResponse
    {
        $courses = Course::query()
            ->orderBy('semester')
            ->orderBy('kode')
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'kode' => $course->kode,
                'nama' => $course->nama,
                'sks' => $course->sks,
                'semester' => $course->semester,
                'dosen' => $course->dosen,
                'jadwal' => $course->jadwal,
                'ruangan' => $course->ruangan,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Daftar mata kuliah berhasil diambil.',
            'data' => $courses,
        ]);
    }

    /**
     * GET /api/krs
     * Mengambil data KRS mahasiswa demo beserta daftar mata kuliah yang dipilih dan total SKS.
     */
    public function index(): JsonResponse
    {
        $studyPlan = $this->getOrCreateDefaultStudyPlan();

        return response()->json([
            'success' => true,
            'message' => 'Data KRS berhasil diambil.',
            'data' => $this->formatStudyPlanPayload($studyPlan),
        ]);
    }

    /**
     * POST /api/krs
     * Menambahkan mata kuliah ke dalam KRS dengan validasi bisnis penuh.
     */
    public function store(Request $request): JsonResponse
    {
        $courseId = $request->input('mata_kuliah_id', $request->input('course_id'));

        if ($courseId === null || ! is_numeric($courseId)) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter mata_kuliah_id wajib diisi dan berupa angka.',
                'errors' => [
                    'mata_kuliah_id' => ['Parameter mata_kuliah_id wajib diisi.'],
                ],
            ], 422);
        }

        $courseId = (int) $courseId;

        return DB::transaction(function () use ($courseId): JsonResponse {
            $studyPlan = $this->getOrCreateDefaultStudyPlan(lock: true);

            // 1. Validasi: Tidak boleh mengubah KRS setelah diajukan
            if ($studyPlan->isSubmitted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'KRS sudah diajukan dan terkunci. Tidak dapat menambah mata kuliah.',
                ], 422);
            }

            // 2. Validasi: Mata kuliah harus ada di database
            $course = Course::query()->find($courseId);
            if (! $course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mata kuliah yang dipilih tidak ditemukan.',
                ], 404);
            }

            // 3. Validasi: Tidak boleh duplikat mata kuliah
            $alreadyExists = StudyPlanItem::query()
                ->where('study_plan_id', $studyPlan->id)
                ->where('course_id', $course->id)
                ->exists();

            if ($alreadyExists) {
                return response()->json([
                    'success' => false,
                    'message' => "Mata kuliah \"{$course->kode} - {$course->nama}\" sudah terdaftar di dalam KRS Anda.",
                ], 422);
            }

            // 4. Validasi: Total SKS maksimal 24
            $currentTotalSks = $this->calculateTotalSks($studyPlan->id);
            $newTotalSks = $currentTotalSks + $course->sks;

            if ($newTotalSks > $studyPlan->max_sks) {
                $sisaSks = max(0, $studyPlan->max_sks - $currentTotalSks);

                return response()->json([
                    'success' => false,
                    'message' => "Batas maksimal {$studyPlan->max_sks} SKS terlampaui. Total SKS saat ini {$currentTotalSks} SKS (sisa kuota {$sisaSks} SKS), tidak dapat menambah \"{$course->nama}\" ({$course->sks} SKS) karena total akan menjadi {$newTotalSks} SKS.",
                ], 422);
            }

            StudyPlanItem::query()->create([
                'study_plan_id' => $studyPlan->id,
                'course_id' => $course->id,
            ]);

            $studyPlan->refresh();

            return response()->json([
                'success' => true,
                'message' => "Mata kuliah \"{$course->kode} - {$course->nama}\" ({$course->sks} SKS) berhasil ditambahkan ke KRS.",
                'data' => $this->formatStudyPlanPayload($studyPlan),
            ], 201);
        });
    }

    /**
     * DELETE /api/krs/{id}
     * Menghapus mata kuliah dari KRS.
     */
    public function destroy(string $id): JsonResponse
    {
        if (! is_numeric($id)) {
            return response()->json([
                'success' => false,
                'message' => 'ID item KRS tidak valid.',
            ], 422);
        }

        $targetId = (int) $id;

        return DB::transaction(function () use ($targetId): JsonResponse {
            $studyPlan = $this->getOrCreateDefaultStudyPlan(lock: true);

            // 1. Validasi: Tidak boleh mengubah KRS setelah diajukan
            if ($studyPlan->isSubmitted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'KRS sudah diajukan dan terkunci. Tidak dapat menghapus mata kuliah.',
                ], 422);
            }

            // Cari berdasarkan ID item KRS terlebih dahulu, atau fallback ke course_id
            $item = StudyPlanItem::query()
                ->with('course')
                ->where('study_plan_id', $studyPlan->id)
                ->where(function ($query) use ($targetId) {
                    $query->where('id', $targetId)
                        ->orWhere('course_id', $targetId);
                })
                ->first();

            if (! $item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mata kuliah tidak ditemukan di dalam daftar KRS.',
                ], 404);
            }

            $courseName = $item->course ? "{$item->course->kode} - {$item->course->nama}" : 'Mata kuliah';
            $item->delete();

            $studyPlan->refresh();

            return response()->json([
                'success' => true,
                'message' => "{$courseName} berhasil dihapus dari KRS.",
                'data' => $this->formatStudyPlanPayload($studyPlan),
            ]);
        });
    }

    /**
     * POST /api/krs/ajukan
     * Mengajukan KRS dan mengunci perubahan.
     */
    public function ajukan(): JsonResponse
    {
        return DB::transaction(function (): JsonResponse {
            $studyPlan = $this->getOrCreateDefaultStudyPlan(lock: true);

            if ($studyPlan->isSubmitted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'KRS sudah diajukan sebelumnya.',
                ], 422);
            }

            $totalSks = $this->calculateTotalSks($studyPlan->id);

            if ($totalSks <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'KRS masih kosong. Pilih minimal 1 mata kuliah sebelum mengajukan KRS.',
                ], 422);
            }

            if ($totalSks > $studyPlan->max_sks) {
                return response()->json([
                    'success' => false,
                    'message' => "Total SKS ({$totalSks}) melebihi batas maksimal {$studyPlan->max_sks} SKS.",
                ], 422);
            }

            $studyPlan->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "KRS dengan total {$totalSks} SKS berhasil diajukan dan telah dikunci.",
                'data' => $this->formatStudyPlanPayload($studyPlan->fresh()),
            ]);
        });
    }

    /**
     * POST /api/krs/batal-ajukan
     * Membuka kembali status KRS menjadi draft (khusus utilitas demo seminar).
     */
    public function batalAjukan(): JsonResponse
    {
        return DB::transaction(function (): JsonResponse {
            $studyPlan = $this->getOrCreateDefaultStudyPlan(lock: true);

            $studyPlan->update([
                'status' => 'draft',
                'submitted_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status KRS berhasil dikembalikan ke Draft.',
                'data' => $this->formatStudyPlanPayload($studyPlan->fresh()),
            ]);
        });
    }

    private function getOrCreateDefaultStudyPlan(bool $lock = false): StudyPlan
    {
        $query = StudyPlan::query()->where('student_nim', '202601001');

        if ($lock) {
            $query->lockForUpdate();
        }

        $studyPlan = $query->first();

        if (! $studyPlan) {
            $studyPlan = StudyPlan::query()->create([
                'student_nim' => '202601001',
                'student_name' => 'Budi Santoso',
                'prodi' => 'S1 Teknik Informatika',
                'semester' => 'Ganjil 2026/2027',
                'max_sks' => 24,
                'status' => 'draft',
                'submitted_at' => null,
            ]);
        }

        return $studyPlan;
    }

    private function calculateTotalSks(int $studyPlanId): int
    {
        return (int) StudyPlanItem::query()
            ->join('courses', 'study_plan_items.course_id', '=', 'courses.id')
            ->where('study_plan_items.study_plan_id', $studyPlanId)
            ->sum('courses.sks');
    }

    private function formatStudyPlanPayload(StudyPlan $studyPlan): array
    {
        $items = StudyPlanItem::query()
            ->with('course')
            ->where('study_plan_id', $studyPlan->id)
            ->orderBy('id')
            ->get()
            ->filter(fn (StudyPlanItem $item) => $item->course !== null)
            ->values()
            ->map(fn (StudyPlanItem $item) => [
                'id' => $item->id,
                'mata_kuliah_id' => $item->course_id,
                'course_id' => $item->course_id,
                'kode' => $item->course->kode,
                'nama' => $item->course->nama,
                'sks' => $item->course->sks,
                'semester' => $item->course->semester,
                'dosen' => $item->course->dosen,
                'jadwal' => $item->course->jadwal,
                'ruangan' => $item->course->ruangan,
                'created_at' => $item->created_at?->toISOString(),
            ]);

        $totalSks = (int) $items->sum('sks');

        return [
            'id' => $studyPlan->id,
            'mahasiswa' => [
                'nim' => $studyPlan->student_nim,
                'nama' => $studyPlan->student_name,
                'prodi' => $studyPlan->prodi,
                'semester' => $studyPlan->semester,
            ],
            'status' => $studyPlan->status,
            'is_submitted' => $studyPlan->isSubmitted(),
            'submitted_at' => $studyPlan->submitted_at?->toISOString(),
            'total_sks' => $totalSks,
            'max_sks' => $studyPlan->max_sks,
            'sisa_sks' => max(0, $studyPlan->max_sks - $totalSks),
            'items' => $items,
        ];
    }
}
