import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function getAuthHeaders() {
  let token = null;
  if (typeof document !== "undefined") {
    const value = `; ${document.cookie}`;
    const adminParts = value.split(`; adminToken=`);
    if (adminParts.length === 2) {
      token = adminParts.pop().split(";").shift();
    }
    if (!token) {
      const userParts = value.split(`; userToken=`);
      if (userParts.length === 2) {
        token = userParts.pop().split(";").shift();
      }
    }
  }
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("adminToken") || localStorage.getItem("userToken");
  }

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Async Thunks
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/users`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch users");
      }
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to create user");
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, ...userData }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/users/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to update user");
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete user");
      }
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.users = action.payload;
        } else if (Array.isArray(action.payload?.data)) {
          state.users = action.payload.data;
        } else if (Array.isArray(action.payload?.users)) {
          state.users = action.payload.users;
        } else {
          state.users = [];
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create User
      .addCase(createUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.submitting = false;
        const newUser = action.payload?.data || action.payload;
        if (newUser && (newUser.id || newUser.email)) {
          state.users.unshift(newUser);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Update User
      .addCase(updateUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.submitting = false;
        const updatedUser = action.payload?.data || action.payload;
        if (updatedUser && updatedUser.id) {
          const index = state.users.findIndex((u) => u.id === updatedUser.id);
          if (index !== -1) {
            state.users[index] = updatedUser;
          }
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.submitting = false;
        const deletedId = action.payload?.id || action.payload;
        state.users = state.users.filter((u) => u.id !== deletedId);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;
