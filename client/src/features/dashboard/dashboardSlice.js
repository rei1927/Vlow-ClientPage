import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import dashboardService from "./dashboardService";

const initialState = {
  stats: null,
  adminStats: null,
  isLoading: false,
  isAdminLoading: false,
  isError: false,
  message: "",
};

// Helper Error Message
const getErrorMsg = (error) => error.response?.data?.message || error.message;

// --- THUNKS ---
export const getDashboardStats = createAsyncThunk(
  "dashboard/getStats",
  async (_, thunkAPI) => {
    try {
      return await dashboardService.getDashboardStats();
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMsg(error));
    }
  }
);

export const getAdminDashboardStats = createAsyncThunk(
  "dashboard/getAdminStats",
  async (_, thunkAPI) => {
    try {
      return await dashboardService.getAdminDashboardStats();
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMsg(error));
    }
  }
);

// --- SLICE ---
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboardState: (state) => {
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Customer Dashboard Stats
      .addCase(getDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.data;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Admin Dashboard Stats
      .addCase(getAdminDashboardStats.pending, (state) => {
        state.isAdminLoading = true;
      })
      .addCase(getAdminDashboardStats.fulfilled, (state, action) => {
        state.isAdminLoading = false;
        state.adminStats = action.payload.data;
      })
      .addCase(getAdminDashboardStats.rejected, (state, action) => {
        state.isAdminLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetDashboardState } = dashboardSlice.actions;
export default dashboardSlice.reducer;
