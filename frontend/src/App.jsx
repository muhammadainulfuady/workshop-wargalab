import { useState, useEffect, useCallback, useMemo } from 'react';
import { krsApi } from './services/api';

export default function App() {
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [krsData, setKrsData] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingCourseId, setProcessingCourseId] = useState(null);
  const [processingDeleteId, setProcessingDeleteId] = useState(null);
  const [isSubmittingKrs, setIsSubmittingKrs] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sksFilter, setSksFilter] = useState('ALL');

  const clearNotifications = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const loadData = useCallback(async () => {
    const [mkResponse, krsResponse] = await Promise.all([
      krsApi.getMataKuliah(),
      krsApi.getKrs(),
    ]);

    setMataKuliahList(Array.isArray(mkResponse?.data) ? mkResponse.data : []);
    setKrsData(krsResponse?.data || null);
    setErrorMessage('');
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } catch (err) {
      setErrorMessage(
        err.message || 'Gagal memuat data dari server backend.'
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    let active = true;
    Promise.all([krsApi.getMataKuliah(), krsApi.getKrs()])
      .then(([mkResponse, krsResponse]) => {
        if (!active) return;
        setMataKuliahList(Array.isArray(mkResponse?.data) ? mkResponse.data : []);
        setKrsData(krsResponse?.data || null);
        setErrorMessage('');
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(
          err.message || 'Gagal memuat data dari server backend.'
        );
      })
      .finally(() => {
        if (!active) return;
        setIsInitialLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleTambahMk = async (course) => {
    clearNotifications();
    setProcessingCourseId(course.id);

    try {
      const res = await krsApi.tambahMataKuliah(course.id);
      if (res?.data) {
        setKrsData(res.data);
      } else {
        await fetchAllData(false);
      }
      setSuccessMessage(
        res?.message ||
          `Mata kuliah "${course.nama}" (${course.sks} SKS) berhasil ditambahkan ke KRS.`
      );
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setProcessingCourseId(null);
    }
  };

  const handleHapusMk = async (item) => {
    clearNotifications();
    setProcessingDeleteId(item.id);

    try {
      const res = await krsApi.hapusMataKuliah(item.id);
      if (res?.data) {
        setKrsData(res.data);
      } else {
        await fetchAllData(false);
      }
      setSuccessMessage(
        res?.message ||
          `Mata kuliah "${item.nama}" (${item.sks} SKS) berhasil dihapus dari KRS.`
      );
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setProcessingDeleteId(null);
    }
  };

  const handleAjukanKrs = async () => {
    clearNotifications();
    setIsSubmittingKrs(true);

    try {
      const res = await krsApi.ajukanKrs();
      if (res?.data) {
        setKrsData(res.data);
      } else {
        await fetchAllData(false);
      }
      setSuccessMessage(
        res?.message || 'KRS berhasil diajukan dan telah dikunci.'
      );
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmittingKrs(false);
    }
  };

  const handleBatalAjukan = async () => {
    clearNotifications();
    setIsSubmittingKrs(true);

    try {
      const res = await krsApi.batalAjukanKrs();
      if (res?.data) {
        setKrsData(res.data);
      } else {
        await fetchAllData(false);
      }
      setSuccessMessage(
        res?.message || 'Status KRS dikembalikan ke Draft untuk keperluan demo.'
      );
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmittingKrs(false);
    }
  };

  const krsItems = useMemo(() => krsData?.items || [], [krsData]);
  const totalSks = krsData?.total_sks ?? 0;
  const maxSks = krsData?.max_sks ?? 24;
  const sisaSks = Math.max(0, maxSks - totalSks);
  const isSubmitted =
    krsData?.status === 'submitted' || krsData?.status === 'diajukan';

  const takenCourseIds = useMemo(
    () => new Set(krsItems.map((item) => item.mata_kuliah_id ?? item.course_id)),
    [krsItems]
  );

  const filteredMataKuliah = useMemo(() => {
    return mataKuliahList.filter((mk) => {
      const matchesSearch =
        !searchQuery.trim() ||
        mk.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mk.kode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mk.dosen?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSks =
        sksFilter === 'ALL' || Number(mk.sks) === Number(sksFilter);

      return matchesSearch && matchesSks;
    });
  }, [mataKuliahList, searchQuery, sksFilter]);

  const progressPercentage = Math.min(100, Math.round((totalSks / maxSks) * 100));

  const getProgressColor = () => {
    if (totalSks >= 22) return 'bg-amber-500';
    if (totalSks >= 18) return 'bg-emerald-500';
    return 'bg-indigo-600';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              KRS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Portal Akademik — Mini KRS Mahasiswa
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Demo Seminar AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                React + Vite + Tailwind CSS &bull; Laravel 13 REST API &bull; SQLite Database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {krsData && (
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border ${
                  isSubmitted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSubmitted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                Status: {isSubmitted ? 'Diajukan (Terkunci)' : 'Draft KRS'}
              </span>
            )}

            <button
              type="button"
              onClick={() => fetchAllData(false)}
              disabled={isInitialLoading || isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition cursor-pointer"
              title="Muat ulang data dari server"
            >
              <svg
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Notifications (Error / Success) */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  Validasi Gagal / Terjadi Kesalahan
                </h3>
                <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-red-500 hover:text-red-700 p-1 rounded-lg cursor-pointer"
              aria-label="Tutup pesan error"
            >
              &#10005;
            </button>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-emerald-800">
                  Berhasil
                </h3>
                <p className="text-sm text-emerald-700 mt-0.5">
                  {successMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-emerald-500 hover:text-emerald-700 p-1 rounded-lg cursor-pointer"
              aria-label="Tutup pesan sukses"
            >
              &#10005;
            </button>
          </div>
        )}

        {/* Top Summary Cards: Student Info & SKS Quota */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Student Profile Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Profil Mahasiswa (Single Student Demo)
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {krsData?.mahasiswa?.nama || 'Budi Santoso'}
                </h2>
                <p className="text-sm text-slate-500">
                  NIM: <span className="font-mono font-semibold text-slate-700">{krsData?.mahasiswa?.nim || '202601001'}</span> &bull;{' '}
                  {krsData?.mahasiswa?.prodi || 'S1 Teknik Informatika'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                  {krsData?.mahasiswa?.semester || 'Ganjil 2026/2027'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Mata Kuliah Diambil</p>
                <p className="text-lg font-bold text-slate-900">
                  {krsItems.length} <span className="text-xs font-normal text-slate-500">MK</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Batas Maksimum</p>
                <p className="text-lg font-bold text-slate-900">
                  {maxSks} <span className="text-xs font-normal text-slate-500">SKS</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Waktu Pengajuan</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">
                  {krsData?.submitted_at
                    ? new Date(krsData.submitted_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Belum diajukan'}
                </p>
              </div>
            </div>
          </div>

          {/* SKS Quota Progress Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kuota Beban Studi (SKS)
                </span>
                <span className="text-xs font-medium text-slate-600">
                  Sisa Kuota: <strong className="text-indigo-600">{sisaSks} SKS</strong>
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-3xl font-extrabold text-slate-900">
                    {totalSks}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    {' '}
                    / {maxSks} SKS Maksimal
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {progressPercentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-3 border border-slate-200/60">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${getProgressColor()}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              {isSubmitted
                ? 'KRS telah diajukan dan dikunci secara permanen di database SQLite.'
                : totalSks === maxSks
                ? 'Kuota maksimal 24 SKS telah terpenuhi.'
                : `Anda masih dapat mengambil maksimal ${sisaSks} SKS lagi sebelum mengajukan KRS.`}
            </p>
          </div>
        </section>

        {/* Loading State Skeleton */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-20 bg-slate-100 rounded-xl w-full" />
              ))}
            </div>
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/2" />
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-slate-100 rounded-xl w-full" />
              ))}
              <div className="h-12 bg-slate-200 rounded-xl w-full" />
            </div>
          </div>
        ) : (
          /* Main 2-Column Content */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Katalog Daftar Mata Kuliah */}
            <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Daftar Mata Kuliah Tersedia
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menampilkan {filteredMataKuliah.length} dari {mataKuliahList.length} mata kuliah di database
                  </p>
                </div>

                {/* Search & SKS Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode, nama MK, dosen..."
                    className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <select
                    value={sksFilter}
                    onChange={(e) => setSksFilter(e.target.value)}
                    className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua SKS</option>
                    <option value="2">2 SKS</option>
                    <option value="3">3 SKS</option>
                    <option value="4">4 SKS</option>
                  </select>
                </div>
              </div>

              {filteredMataKuliah.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">
                  Tidak ada mata kuliah yang cocok dengan pencarian Anda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMataKuliah.map((mk) => {
                    const isTaken = takenCourseIds.has(mk.id);
                    const isLoadingThis = processingCourseId === mk.id;
                    const wouldExceedSks = !isTaken && totalSks + mk.sks > maxSks;

                    return (
                      <div
                        key={mk.id}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                          isTaken ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {mk.kode}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {mk.sks} SKS
                            </span>
                            {mk.semester && (
                              <span className="text-xs text-slate-500">
                                Semester {mk.semester}
                              </span>
                            )}
                            {isTaken && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                                &#10003; Terdaftar di KRS
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            {mk.nama}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            {mk.dosen && <span>Dosen: {mk.dosen}</span>}
                            {mk.jadwal && <span>Jadwal: {mk.jadwal}</span>}
                            {mk.ruangan && <span>Ruang: {mk.ruangan}</span>}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleTambahMk(mk)}
                            disabled={
                              isLoadingThis || isSubmittingKrs || isTaken || isSubmitted
                            }
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer disabled:cursor-not-allowed ${
                              isTaken
                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                : isSubmitted
                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                : wouldExceedSks
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                            }`}
                            title={
                              isTaken
                                ? 'Mata kuliah sudah dipilih'
                                : isSubmitted
                                ? 'KRS sudah diajukan dan terkunci'
                                : wouldExceedSks
                                ? `Klik untuk menguji validasi backend (Total SKS akan menjadi ${
                                    totalSks + mk.sks
                                  } SKS > 24 SKS)`
                                : 'Tambahkan mata kuliah ke KRS'
                            }
                          >
                            {isLoadingThis ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Memproses...
                              </>
                            ) : isTaken ? (
                              'Sudah Diambil'
                            ) : (
                              <>
                                <span>+ Ambil</span>
                                {wouldExceedSks && (
                                  <span className="text-[11px] font-normal">
                                    (&gt;24 SKS)
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Right Column: Panel KRS Mahasiswa */}
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden sticky top-24">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Kartu Rencana Studi (KRS)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar mata kuliah yang direncanakan semester ini
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalSks} / {maxSks} SKS
                </span>
              </div>

              {/* Locked Banner if Submitted */}
              {isSubmitted && (
                <div className="bg-emerald-50/80 border-b border-emerald-200 px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm font-medium">
                    <svg
                      className="w-5 h-5 text-emerald-600 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                    <span>
                      KRS telah diajukan dan dikunci. Penambahan atau penghapusan mata kuliah dinonaktifkan.
                    </span>
                  </div>
                </div>
              )}

              {/* Selected Courses List */}
              {krsItems.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold">
                    0
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Belum Ada Mata Kuliah Dipilih
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Silakan pilih mata kuliah dari daftar di sebelah kiri dengan menekan tombol <strong>+ Ambil</strong>.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                  {krsItems.map((item, idx) => {
                    const isDeletingThis = processingDeleteId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">
                              #{idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                              {item.kode}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                              {item.sks} SKS
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                            {item.nama}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.jadwal} {item.ruangan ? `• ${item.ruangan}` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleHapusMk(item)}
                          disabled={isDeletingThis || isSubmittingKrs || isSubmitted}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                          title={
                            isSubmitted
                              ? 'Tidak dapat menghapus karena KRS sudah diajukan'
                              : 'Hapus mata kuliah dari KRS'
                          }
                        >
                          {isDeletingThis ? (
                            <span className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Hapus'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer Summary & Submit Button */}
              <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    Total SKS Direncanakan
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {totalSks} SKS{' '}
                    <span className="text-xs font-normal text-slate-500">
                      (Maks. {maxSks} SKS)
                    </span>
                  </span>
                </div>

                {!isSubmitted ? (
                  <button
                    type="button"
                    onClick={handleAjukanKrs}
                    disabled={isSubmittingKrs || krsItems.length === 0}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmittingKrs ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mengajukan KRS...
                      </>
                    ) : (
                      <>
                        <span>Ajukan KRS Sekarang</span>
                        <span>({totalSks} SKS)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-emerald-800 bg-emerald-100 border border-emerald-200 text-center">
                      &#10003; KRS Telah Disetujui / Diajukan
                    </div>
                    <button
                      type="button"
                      onClick={handleBatalAjukan}
                      disabled={isSubmittingKrs}
                      className="w-full py-2 px-3 rounded-xl font-medium text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 transition cursor-pointer"
                    >
                      {isSubmittingKrs
                        ? 'Memproses...'
                        : 'Reset Status ke Draft (Utilitas Demo Seminar)'}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
