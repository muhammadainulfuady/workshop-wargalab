<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyPlanItem extends Model
{
    protected $fillable = [
        'study_plan_id',
        'course_id',
    ];

    protected function casts(): array
    {
        return [
            'study_plan_id' => 'integer',
            'course_id' => 'integer',
        ];
    }

    public function studyPlan(): BelongsTo
    {
        return $this->belongsTo(StudyPlan::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
