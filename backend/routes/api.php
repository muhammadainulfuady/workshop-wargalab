<?php

use App\Http\Controllers\Api\KrsController;
use Illuminate\Support\Facades\Route;

Route::get('/mata-kuliah', [KrsController::class, 'mataKuliah']);
Route::get('/krs', [KrsController::class, 'index']);
Route::post('/krs', [KrsController::class, 'store']);
Route::delete('/krs/{id}', [KrsController::class, 'destroy']);
Route::post('/krs/ajukan', [KrsController::class, 'ajukan']);
Route::post('/krs/batal-ajukan', [KrsController::class, 'batalAjukan']);
