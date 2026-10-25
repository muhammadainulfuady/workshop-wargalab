<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudyPlan extends Model
{
    protected $fillable = [
        'student_nim',
        'student_name',
        'prodi',
        'semester',
        'max_sks',
        'status',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'max_sks' => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(StudyPlanItem::class);
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }
}
