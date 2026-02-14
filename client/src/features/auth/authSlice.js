import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

// Cek User di LocalStorage
const user = JSON.parse(localStorage.getItem("user"));

const initialState = {
  user: user ? user : null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// --- Login Thunk ---
export const loginUser = createAsyncThunk("auth/login", async (user, thunkAPI) => {
  try {
    return await authService.login(user);
  } catch (error) {
    // Priority pengambilan pesan error
    const message =
      (error.response && error.response.data && error.response.data.message) || // Pesan dari Middleware Backend
      error.message ||
      error.toString();

    return thunkAPI.rejectWithValue(message);
  }
});

// --- Logout Thunk ---
export const logoutUser = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    return await authService.logout();
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Forgot Password Thunk
export const forgotPasswordUser = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkAPI) => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// Reset Password Thunk
export const resetPasswordUser = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, thunkAPI) => {
    try {
      return await authService.resetPassword(token, password);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    updateUserSession: (state, action) => {
      if (state.user) {
        // 1. Merge data lama dengan data baru
        const updatedUser = { ...state.user, ...action.payload };

        // 2. Update State Redux
        state.user = updatedUser;

        // 3. Update LocalStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    },
    logoutLocal: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload; // Pesan error spesifik (ex: "Password salah")
        state.user = null;
      })
      // Logout Cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })

      // Forgot Password
      .addCase(forgotPasswordUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPasswordUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
      })
      .addCase(forgotPasswordUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Reset Password
      .addCase(resetPasswordUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPasswordUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        // PENTING: Jangan set state.user = action.payload
        // Kita biarkan user null agar dia harus login manual
        state.user = null;
        state.message = "Password berhasil diubah. Silakan login kembali.";
      })
      .addCase(resetPasswordUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, logoutLocal, updateUserSession } = authSlice.actions;
export default authSlice.reducer;
