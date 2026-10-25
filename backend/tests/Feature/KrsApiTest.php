<?php

namespace Tests\Feature;

use App\Models\Course;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KrsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_can_fetch_at_least_12_mata_kuliah(): void
    {
        $response = $this->getJson('/api/mata-kuliah');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(12, count($response->json('data')));
    }

    public function test_can_get_initial_krs_state(): void
    {
        $response = $this->getJson('/api/krs');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.total_sks', 0)
            ->assertJsonPath('data.max_sks', 24);
    }

    public function test_can_add_and_delete_course_and_reject_duplicate(): void
    {
        $course = Course::query()->first();

        // Tambah mata kuliah
        $addResponse = $this->postJson('/api/krs', [
            'mata_kuliah_id' => $course->id,
        ]);

        $addResponse->assertStatus(201)
            ->assertJsonPath('data.total_sks', $course->sks);

        // Duplikat mata kuliah harus ditolak
        $dupResponse = $this->postJson('/api/krs', [
            'mata_kuliah_id' => $course->id,
        ]);

        $dupResponse->assertStatus(422)
            ->assertJsonPath('success', false);

        // Hapus mata kuliah berdasarkan item ID
        $itemId = $addResponse->json('data.items.0.id');
        $delResponse = $this->deleteJson("/api/krs/{$itemId}");

        $delResponse->assertStatus(200)
            ->assertJsonPath('data.total_sks', 0);
    }

    public function test_cannot_exceed_24_sks_limit(): void
    {
        $courses = Course::query()->orderByDesc('sks')->get();
        $accumulatedSks = 0;

        foreach ($courses as $course) {
            if ($accumulatedSks + $course->sks <= 24) {
                $res = $this->postJson('/api/krs', ['mata_kuliah_id' => $course->id]);
                $res->assertStatus(201);
                $accumulatedSks += $course->sks;
            } else {
                // Course ini akan membuat SKS > 24, harus ditolak dengan 422
                $res = $this->postJson('/api/krs', ['mata_kuliah_id' => $course->id]);
                $res->assertStatus(422)
                    ->assertJsonPath('success', false);
                break;
            }
        }

        $this->assertLessThanOrEqual(24, $accumulatedSks);
    }

    public function test_cannot_modify_krs_after_ajukan(): void
    {
        // Tidak bisa ajukan jika KRS masih kosong
        $emptySubmit = $this->postJson('/api/krs/ajukan');
        $emptySubmit->assertStatus(422);

        $courses = Course::query()->take(2)->get();
        $firstAdd = $this->postJson('/api/krs', ['mata_kuliah_id' => $courses[0]->id]);
        $firstAdd->assertStatus(201);
        $itemId = $firstAdd->json('data.items.0.id');

        // Ajukan KRS
        $submitRes = $this->postJson('/api/krs/ajukan');
        $submitRes->assertStatus(200)
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.is_submitted', true);

        // Tambah setelah diajukan harus ditolak
        $addAfterSubmit = $this->postJson('/api/krs', ['mata_kuliah_id' => $courses[1]->id]);
        $addAfterSubmit->assertStatus(422);

        // Hapus setelah diajukan harus ditolak
        $deleteAfterSubmit = $this->deleteJson("/api/krs/{$itemId}");
        $deleteAfterSubmit->assertStatus(422);
    }
}
