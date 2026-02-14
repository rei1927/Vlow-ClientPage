import axios from "axios";

// 1. Buat Instance Axios
const axiosInstance = axios.create({
  baseURL: "/api", // Sesuaikan URL Backend Anda
  withCredentials: true, // WAJIB: Agar browser mau mengirim/menerima Cookie HttpOnly
});

// Variable untuk menyimpan store Redux (karena kita tidak bisa panggil hook di sini)
let store;

// Fungsi injectStore agar file ini bisa akses Redux dispatch
export const injectStore = (_store) => {
  store = _store;
};

// 2. Response Interceptor (Penjaga Gawang)
axiosInstance.interceptors.response.use(
  (response) => {
    return response; // Jika sukses, loloskan
  },
  (error) => {
    // Jika Error 401 (Unauthorized) dari Backend
    if (error.response && error.response.status === 401) {
      if (store) {
        // Panggil action logoutLocal di Redux untuk hapus state user
        store.dispatch({ type: "auth/logoutLocal" });
        // Redirect paksa ke login page (opsional, karena Redux state berubah, UI biasanya otomatis redirect)
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
