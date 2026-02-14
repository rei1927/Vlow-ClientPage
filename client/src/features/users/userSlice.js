import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userService from "./userService";

const initialState = {
  users: [],
  // Pastikan pagination punya struktur awal agar tidak undefined saat pertama render
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// --- THUNKS ---

export const fetchUsers = createAsyncThunk("users/fetchAll", async (params, thunkAPI) => {
  try {
    return await userService.getUsers(params);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const createNewUser = createAsyncThunk("users/create", async (userData, thunkAPI) => {
  try {
    return await userService.createUser(userData);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateExistingUser = createAsyncThunk(
  "users/update",
  async ({ id, userData }, thunkAPI) => {
    try {
      return await userService.updateUser({ id, userData });
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const removeUser = createAsyncThunk("users/delete", async (id, thunkAPI) => {
  try {
    return await userService.deleteUser(id);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// --- SLICE ---

export const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create
      .addCase(createNewUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "User berhasil ditambahkan.";
        state.users.unshift(action.payload.data); // Tambah ke list tanpa refresh
      })
      .addCase(createNewUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Update
      .addCase(updateExistingUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateExistingUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "User berhasil diperbarui.";
        // Update data di state lokal
        const index = state.users.findIndex((u) => u.id === action.payload.data.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload.data };
        }
      })
      .addCase(updateExistingUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete
      .addCase(removeUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "User berhasil dihapus.";
        // Hapus dari state lokal
        state.users = state.users.filter((u) => u.id !== action.meta.arg);
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;
