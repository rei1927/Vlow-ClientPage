import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

// Cek User di LocalStorage
const user = JSON.parse(localStorage.getItem("user"));
const isImpersonating = localStorage.getItem("isImpersonating") === "true";
const originalAdmin = JSON.parse(localStorage.getItem("originalAdmin"));

const initialState = {
  user: user ? user : null,
  isImpersonating: isImpersonating || false,
  originalAdmin: originalAdmin || null,
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
    const message =
      (error.response && error.response.data && error.response.data.message) ||
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

// --- Impersonate Thunk (Admin masuk sebagai User lain) ---
export const impersonateUser = createAsyncThunk(
  "auth/impersonate",
  async (userId, thunkAPI) => {
    try {
      return await authService.impersonate(userId);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// --- Stop Impersonating Thunk (Kembali ke Admin) ---
export const stopImpersonateUser = createAsyncThunk(
  "auth/stopImpersonate",
  async (adminId, thunkAPI) => {
    try {
      return await authService.stopImpersonating(adminId);
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
        const updatedUser = { ...state.user, ...action.payload };
        state.user = updatedUser;
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    },
    logoutLocal: (state) => {
      state.user = null;
      state.isImpersonating = false;
      state.originalAdmin = null;
      localStorage.removeItem("user");
      localStorage.removeItem("isImpersonating");
      localStorage.removeItem("originalAdmin");
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
        state.message = action.payload;
        state.user = null;
      })
      // Logout Cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isImpersonating = false;
        state.originalAdmin = null;
        localStorage.removeItem("isImpersonating");
        localStorage.removeItem("originalAdmin");
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
        state.user = null;
        state.message = "Password berhasil diubah. Silakan login kembali.";
      })
      .addCase(resetPasswordUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Impersonate User
      .addCase(impersonateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(impersonateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.isImpersonating = true;
        state.originalAdmin = action.payload.originalAdmin;
        state.message = `Berhasil masuk sebagai ${action.payload.user.name}`;
      })
      .addCase(impersonateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Stop Impersonating
      .addCase(stopImpersonateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(stopImpersonateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.isImpersonating = false;
        state.originalAdmin = null;
        state.message = "Kembali ke akun Admin.";
      })
      .addCase(stopImpersonateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, logoutLocal, updateUserSession } = authSlice.actions;
export default authSlice.reducer;

