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
  if (response.data && response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

// Impersonate User (Admin login sebagai Customer)
const impersonate = async (userId) => {
  const response = await axiosInstance.post(`/auth/impersonate/${userId}`);
  if (response.data && response.data.user) {
    // Simpan data admin asli sebelum switch
    localStorage.setItem("originalAdmin", JSON.stringify(response.data.originalAdmin));
    localStorage.setItem("isImpersonating", "true");
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

// Stop Impersonating (Kembali ke Admin)
const stopImpersonating = async (adminId) => {
  const response = await axiosInstance.post(`/auth/stop-impersonate/${adminId}`);
  if (response.data && response.data.user) {
    // Hapus data impersonation dan restore admin
    localStorage.removeItem("originalAdmin");
    localStorage.removeItem("isImpersonating");
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

const authService = {
  login,
  logout,
  forgotPassword,
  resetPassword,
  impersonate,
  stopImpersonating,
};

export default authService;

