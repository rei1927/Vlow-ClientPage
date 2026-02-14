import axiosInstance from "../../api/axiosInstance";

const API_URL = "/agents";

// Create Agent (Support FormData jika nanti ada inisial file)
const createAgent = async (agentData) => {
  const response = await axiosInstance.post(API_URL, agentData);
  return response.data;
};

// Get All (with Pagination, Search, Filter, Sort)
const getAgents = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.status && params.status !== "all") queryParams.append("status", params.status);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  
  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  
  const response = await axiosInstance.get(url);
  return response.data;
};

// Get Single (Detail)
const getAgentById = async (id) => {
  const response = await axiosInstance.get(`${API_URL}/${id}`);
  return response.data;
};

// Update Agent (General Tab - Support File Upload)
const updateAgent = async ({ id, agentData }) => {
  // agentData harus berupa FormData object jika ada file
  const response = await axiosInstance.put(`${API_URL}/${id}`, agentData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Delete Agent
const deleteAgent = async (id) => {
  const response = await axiosInstance.delete(`${API_URL}/${id}`);
  return response.data;
};

// --- KNOWLEDGE BASE ---

const addKnowledge = async ({ agentId, knowledgeData }) => {
  const response = await axiosInstance.post(`/agents/${agentId}/knowledge`, knowledgeData);
  return response.data;
};

const updateKnowledge = async ({ knowledgeId, knowledgeData }) => {
  const response = await axiosInstance.put(`/agents/knowledge/${knowledgeId}`, knowledgeData);
  return response.data;
};

const deleteKnowledge = async (knowledgeId) => {
  const response = await axiosInstance.delete(`${API_URL}/knowledge/${knowledgeId}`);
  return response.data;
};

const testChat = async (payload) => {
  // Perhatikan: URL-nya sekarang generic, payload dikirim di body
  const response = await axiosInstance.post(`/agents/test-chat`, payload);
  return response.data;
};

const getAgentAnalytics = async (agentId, period = "month") => {
  const response = await axiosInstance.get(`/agents/${agentId}/analytics?period=${period}`);
  return response.data;
};

const agentService = {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  addKnowledge,
  deleteKnowledge,
  updateKnowledge,
  testChat,
  getAgentAnalytics,
};

export default agentService;
