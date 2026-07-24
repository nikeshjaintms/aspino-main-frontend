import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Async Thunks for Pass Categories
export const fetchCategories = createAsyncThunk(
  "passCategory/fetchCategories",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { search = "", page = "", limit = "", type = "all" } = params;
      let url = `${backendUrl}/pass-category?type=${type}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (page) url += `&page=${page}`;
      if (limit) url += `&limit=${limit}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  "passCategory/createCategory",
  async (catData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/pass-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to create category");
        throw new Error(msg);
      }
      return data.category;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  "passCategory/updateCategory",
  async ({ id, catData }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/pass-category/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to update category");
        throw new Error(msg);
      }
      return data.category;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "passCategory/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/pass-category/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const passCategorySlice = createSlice({
  name: "passCategory",
  initialState: {
    categories: [],
    totalCount: 0,
    totalPages: 1,
    totalInward: 0,
    totalOutward: 0,
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearCatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (payload && typeof payload === "object" && "data" in payload) {
          state.categories = payload.data || [];
          state.totalCount = payload.total || 0;
          state.totalPages = payload.totalPages || 1;
          state.totalInward = payload.totalInward || 0;
          state.totalOutward = payload.totalOutward || 0;
        } else {
          state.categories = Array.isArray(payload) ? payload : [];
          state.totalCount = state.categories.length;
          state.totalPages = 1;
          state.totalInward = state.categories.filter((c) => c.type === "INWARD").length;
          state.totalOutward = state.categories.filter((c) => c.type === "OUTWARD").length;
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.submitting = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.categories.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Delete Category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearCatError } = passCategorySlice.actions;
export default passCategorySlice.reducer;
