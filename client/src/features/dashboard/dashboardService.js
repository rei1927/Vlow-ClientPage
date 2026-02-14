import axiosInstance from "../../api/axiosInstance";

const API_URL = "/analytics/dashboard";
const ADMIN_API_URL = "/analytics/admin-dashboard";

// Get Dashboard Stats (Customer)
const getDashboardStats = async () => {
  const response = await axiosInstance.get(API_URL);
  return response.data;
};

// Get Admin Dashboard Stats
const getAdminDashboardStats = async () => {
  const response = await axiosInstance.get(ADMIN_API_URL);
  return response.data;
};

const dashboardService = {
  getDashboardStats,
  getAdminDashboardStats,
};

export default dashboardService;
