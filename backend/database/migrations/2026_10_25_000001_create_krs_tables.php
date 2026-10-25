<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 120);
            $table->unsignedTinyInteger('sks');
            $table->unsignedTinyInteger('semester')->default(3);
            $table->string('dosen', 100);
            $table->string('jadwal', 60);
            $table->string('ruangan', 50);
            $table->timestamps();
        });

        Schema::create('study_plans', function (Blueprint $table) {
            $table->id();
            $table->string('student_nim', 20)->unique();
            $table->string('student_name', 100);
            $table->string('prodi', 100)->default('S1 Teknik Informatika');
            $table->string('semester', 30)->default('Ganjil 2026/2027');
            $table->unsignedTinyInteger('max_sks')->default(24);
            $table->string('status', 20)->default('draft'); // draft | submitted
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('study_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('study_plan_id')->constrained('study_plans')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['study_plan_id', 'course_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('study_plan_items');
        Schema::dropIfExists('study_plans');
        Schema::dropIfExists('courses');
    }
};
