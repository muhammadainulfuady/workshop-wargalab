<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'kode',
        'nama',
        'sks',
        'semester',
        'dosen',
        'jadwal',
        'ruangan',
    ];

    protected function casts(): array
    {
        return [
            'sks' => 'integer',
            'semester' => 'integer',
        ];
    }

    public function studyPlanItems(): HasMany
    {
        return $this->hasMany(StudyPlanItem::class);
    }
}
