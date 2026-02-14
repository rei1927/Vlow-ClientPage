import axiosInstance from "../../api/axiosInstance";

const API_URL = "/platforms";

// Get All Platforms (with pagination, search, filter, sort)
const getPlatforms = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  
  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  const response = await axiosInstance.get(url);
  return response.data;
};

// Create Platform (Init Session)
const createPlatform = async (platformData) => {
  const response = await axiosInstance.post(API_URL, platformData);
  return response.data;
};

// Update Platform (Ganti Nama/Agent)
const updatePlatform = async ({ id, platformData }) => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, platformData);
  return response.data;
};

// Delete Platform
const deletePlatform = async (id) => {
  const response = await axiosInstance.delete(`${API_URL}/${id}`);
  return response.data;
};

// --- NEW FEATURES ---

// Get QR Code Image (Base64)
const getPlatformQR = async (id) => {
  const response = await axiosInstance.get(`${API_URL}/${id}/qr`);
  return response.data;
};

// Check Status Real-time
const getPlatformStatus = async (id) => {
  const response = await axiosInstance.get(`${API_URL}/${id}/status`);
  return response.data;
};

const platformService = {
  getPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getPlatformQR,
  getPlatformStatus,
};

export default platformService;
