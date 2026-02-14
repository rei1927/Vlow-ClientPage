import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import agentService from "./agentService";

const initialState = {
  agents: [],
  currentAgent: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  pagination: null, // Store pagination info from backend
};

// Helper Error
const getErrorMsg = (error) => error.response?.data?.message || error.message;

// --- THUNKS (Tetap sama seperti sebelumnya) ---
export const getAgents = createAsyncThunk(
  "agents/getAll",
  async (params = {}, thunkAPI) => {
    try {
      return await agentService.getAgents(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMsg(error));
    }
  },
);

export const getAgentById = createAsyncThunk("agents/getOne", async (id, thunkAPI) => {
  try {
    return await agentService.getAgentById(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

export const createAgent = createAsyncThunk("agents/create", async (agentData, thunkAPI) => {
  try {
    return await agentService.createAgent(agentData);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

export const updateAgent = createAsyncThunk(
  "agents/update",
  async ({ id, agentData }, thunkAPI) => {
    try {
      return await agentService.updateAgent({ id, agentData });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMsg(error));
    }
  },
);

export const deleteAgent = createAsyncThunk("agents/delete", async (id, thunkAPI) => {
  try {
    return await agentService.deleteAgent(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

export const updateKnowledge = createAsyncThunk(
  "agents/updateKnowledge",
  async ({ knowledgeId, knowledgeData }, thunkAPI) => {
    try {
      return await agentService.updateKnowledge({ knowledgeId, knowledgeData });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const addKnowledge = createAsyncThunk(
  "agents/addKnowledge",
  async ({ agentId, knowledgeData }, thunkAPI) => {
    try {
      return await agentService.addKnowledge({ agentId, knowledgeData });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMsg(error));
    }
  },
);

export const deleteKnowledge = createAsyncThunk(
  "agents/deleteKnowledge",
  async (knowledgeId, thunkAPI) => {
    try {
      return await agentService.deleteKnowledge(knowledgeId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMsg(error));
    }
  },
);

// --- SLICE ---
export const agentSlice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    resetAgentState: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
      state.isLoading = false;
    },
    clearCurrentAgent: (state) => {
      state.currentAgent = null;
    },
  },
  extraReducers: (builder) => {
    // 1. PRIORITAS: Definisikan .addCase (Specific) DULUAN
    builder
      .addCase(getAgents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.agents = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(getAgentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAgent = action.payload.data;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Agent berhasil dibuat";
        state.agents.unshift(action.payload.data);
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Agent berhasil diupdate";
        state.currentAgent = action.payload.data;
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Agent dihapus";
        state.agents = state.agents.filter((a) => a.id !== action.meta.arg);
      })
      .addCase(addKnowledge.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Knowledge berhasil ditambahkan";
        if (state.currentAgent) {
          if (!state.currentAgent.KnowledgeSources) state.currentAgent.KnowledgeSources = [];
          state.currentAgent.KnowledgeSources.push(action.payload.data);
        }
      })

      // Update Knowledge
      .addCase(updateKnowledge.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Knowledge berhasil diperbarui";
        if (state.currentAgent && state.currentAgent.KnowledgeSources) {
          const index = state.currentAgent.KnowledgeSources.findIndex(
            (k) => k.id === action.payload.data.id,
          );
          if (index !== -1) {
            state.currentAgent.KnowledgeSources[index] = action.payload.data;
          }
        }
      })
      .addCase(deleteKnowledge.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Knowledge dihapus";
        if (state.currentAgent && state.currentAgent.KnowledgeSources) {
          state.currentAgent.KnowledgeSources = state.currentAgent.KnowledgeSources.filter(
            (k) => k.id !== action.meta.arg,
          );
        }
      })

      // 2. TERAKHIR: Definisikan .addMatcher (General) PALING BAWAH
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
        },
      );
  },
});

export const { resetAgentState, clearCurrentAgent } = agentSlice.actions;
export default agentSlice.reducer;
