import axiosInstance from "../../api/axiosInstance";

// Login User
const login = async (userData) => {
  const response = await axiosInstance.post("/auth/login", userData);
  // Response backend: { success: true, user: {...} }
  // Token tersimpan otomatis di Cookie browser, kita hanya butuh data user
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data.user;
};

// Logout User
const logout = async () => {
  const response = await axiosInstance.get("/auth/logout");
  localStorage.removeItem("user"); // Hapus data user local
  return response.data;
};

// Forgot Password (Request Email)
const forgotPassword = async (email) => {
  const response = await axiosInstance.post("/auth/forgot-password", { email });
  return response.data;
};

// Reset Password (Submit New Password)
const resetPassword = async (token, password) => {
  const response = await axiosInstance.put(`/auth/reset-password/${token}`, { password });
  // Backend Anda otomatis meloginkan user setelah reset (mengirim token & user)
  if (response.data && response.data.user) {
    // Pastikan backend mengirim object user jika auto-login
    // Jika backend hanya mengirim token tapi tidak user object, kita perlu sesuaikan.
    // Berdasarkan authController.js Anda: sendTokenResponse(user, 200, res);
    // Itu artinya response body ada `user` object. Aman.
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

const authService = {
  login,
  logout,
  forgotPassword,
  resetPassword,
};

export default authService;
