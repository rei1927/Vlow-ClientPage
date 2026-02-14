import axiosInstance from "../../api/axiosInstance";

// Get All Users (dengan query params)
const getUsers = async (params) => {
  // --- LOGIC PERBAIKAN ---
  // Kita bersihkan params. Jika value-nya kosong string ("") atau null, hapus key-nya.
  // Agar URL menjadi bersih: /api/users?page=1&limit=10 (tanpa &role=)

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== ""),
  );

  const response = await axiosInstance.get("/users", { params: cleanParams });
  return response.data;
};

// Create User
const createUser = async (userData) => {
  const response = await axiosInstance.post("/users", userData);
  return response.data;
};

// Update User
const updateUser = async ({ id, userData }) => {
  const response = await axiosInstance.put(`/users/${id}`, userData);
  return response.data;
};

// Delete User
const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`/users/${id}`);
  return response.data;
};

const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
