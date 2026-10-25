const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Gagal terhubung ke server backend Laravel. Pastikan server backend berjalan di http://127.0.0.1:8000.'
    );
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = { message: text || `HTTP Error ${response.status}` };
  }

  if (!response.ok) {
    const errorMessage =
      payload?.message ||
      (payload?.errors && Object.values(payload.errors).flat().join(' ')) ||
      `Terjadi kesalahan pada server (HTTP ${response.status}).`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const krsApi = {
  /**
   * GET /api/mata-kuliah
   * Mengambil seluruh daftar mata kuliah yang ditawarkan dari database
   */
  getMataKuliah: () => request('/mata-kuliah', { method: 'GET' }),

  /**
   * GET /api/krs
   * Mengambil data KRS mahasiswa aktif, item mata kuliah yang diambil, total SKS, dan status pengajuan
   */
  getKrs: () => request('/krs', { method: 'GET' }),

  /**
   * POST /api/krs
   * Menambahkan mata kuliah ke dalam KRS
   * @param {number} mataKuliahId
   */
  tambahMataKuliah: (mataKuliahId) =>
    request('/krs', {
      method: 'POST',
      body: JSON.stringify({ mata_kuliah_id: mataKuliahId }),
    }),

  /**
   * DELETE /api/krs/:id
   * Menghapus item mata kuliah dari KRS berdasarkan ID item KRS
   * @param {number} krsItemId
   */
  hapusMataKuliah: (krsItemId) =>
    request(`/krs/${krsItemId}`, {
      method: 'DELETE',
    }),

  /**
   * POST /api/krs/ajukan
   * Mengajukan KRS dan mengunci perubahan
   */
  ajukanKrs: () =>
    request('/krs/ajukan', {
      method: 'POST',
    }),

  /**
   * POST /api/krs/batal-ajukan
   * Membuka kembali kunci KRS ke status draft (khusus utilitas demo seminar)
   */
  batalAjukanKrs: () =>
    request('/krs/batal-ajukan', {
      method: 'POST',
    }),
};
