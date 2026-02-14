import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import platformService from "./platformService";

const initialState = {
  platforms: [],
  pagination: null, // Pagination metadata
  currentQrCode: null, // Base64 Image
  connectionStatus: "STOPPED", // STOPPED, SCANNING, WORKING
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// Helper Error Message
const getErrorMsg = (error) => error.response?.data?.message || error.message;

// --- THUNKS ---
export const getPlatforms = createAsyncThunk("platforms/getAll", async (params = {}, thunkAPI) => {
  try {
    return await platformService.getPlatforms(params);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

export const createPlatform = createAsyncThunk("platforms/create", async (data, thunkAPI) => {
  try {
    return await platformService.createPlatform(data);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

export const updatePlatform = createAsyncThunk(
  "platforms/update",
  async ({ id, platformData }, thunkAPI) => {
    try {
      return await platformService.updatePlatform({ id, platformData });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMsg(error));
    }
  },
);

export const deletePlatform = createAsyncThunk("platforms/delete", async (id, thunkAPI) => {
  try {
    await platformService.deletePlatform(id);
    return id; // PENTING: Return ID yang dihapus agar reducer tahu
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

export const getPlatformQR = createAsyncThunk("platforms/getQR", async (id, thunkAPI) => {
  try {
    return await platformService.getPlatformQR(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

export const getPlatformStatus = createAsyncThunk("platforms/getStatus", async (id, thunkAPI) => {
  try {
    return await platformService.getPlatformStatus(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMsg(error));
  }
});

// --- SLICE ---
const platformSlice = createSlice({
  name: "platforms",
  initialState,
  reducers: {
    resetPlatformState: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
    },
    clearQR: (state) => {
      state.currentQrCode = null;
      state.connectionStatus = "STOPPED";
    },
  },
  extraReducers: (builder) => {
    builder
      // GET
      .addCase(getPlatforms.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPlatforms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platforms = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(getPlatforms.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // CREATE
      .addCase(createPlatform.pending, (state) => {
        state.isLoading = true;
      }) // Tambahkan ini
      .addCase(createPlatform.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.platforms.unshift(action.payload.data);
      })
      .addCase(createPlatform.rejected, (state, action) => {
        // Tambahkan ini
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // UPDATE
      .addCase(updatePlatform.pending, (state) => {
        state.isLoading = true;
      }) // Tambahkan ini
      .addCase(updatePlatform.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.platforms.findIndex((p) => p.id === action.payload.data.id);
        if (index !== -1) {
          state.platforms[index] = action.payload.data;
        }
      })
      .addCase(updatePlatform.rejected, (state, action) => {
        // Tambahkan ini
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- DELETE (INI PERBAIKAN UTAMANYA) ---
      .addCase(deletePlatform.pending, (state) => {
        // Saat delete dimulai, nyalakan loading
        state.isLoading = true;
      })
      .addCase(deletePlatform.fulfilled, (state, action) => {
        // Saat selesai, matikan loading & hapus data
        state.isLoading = false;
        state.isSuccess = true;
        state.platforms = state.platforms.filter((p) => p.id !== action.payload);
      })
      .addCase(deletePlatform.rejected, (state, action) => {
        // Jika gagal, matikan loading & tampilkan error
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // QR
      .addCase(getPlatformQR.fulfilled, (state, action) => {
        if (action.payload.qr) {
          state.currentQrCode = action.payload.qr;
        }
      })

      // STATUS
      .addCase(getPlatformStatus.fulfilled, (state, action) => {
        state.connectionStatus = action.payload.status;

        // Update status di list juga secara real-time
        const index = state.platforms.findIndex((p) => p.id === action.meta.arg);
        if (index !== -1) {
          state.platforms[index].status = action.payload.status;
        }
      });
  },
});

export const { resetPlatformState, clearQR } = platformSlice.actions;
export default platformSlice.reducer;
