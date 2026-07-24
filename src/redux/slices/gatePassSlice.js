import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Async Thunks
export const fetchGatePasses = createAsyncThunk(
  "gatePass/fetchGatePasses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { search = "", page = 1, limit = 10, type = "all" } = params;
      const typeParam = type.toUpperCase();
      const res = await fetch(
        `${backendUrl}/gate-pass?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}&type=${typeParam}`
      );
      if (!res.ok) throw new Error("Failed to fetch gate passes");
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createGatePass = createAsyncThunk(
  "gatePass/createGatePass",
  async (passData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/gate-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passData),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to create gate pass");
        throw new Error(msg);
      }
      return data.gatePass;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const recordTimeOut = createAsyncThunk(
  "gatePass/recordTimeOut",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/gate-pass/${id}/timeout`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record time out");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const gatePassSlice = createSlice({
  name: "gatePass",
  initialState: {
    passes: [],
    totalCount: 0,
    totalInward: 0,
    totalOutward: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    loading: false,
    submitting: false,
    error: null,
    search: "",
    activeTab: "all",
  },
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      state.currentPage = 1;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
      state.currentPage = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Gate Passes
      .addCase(fetchGatePasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGatePasses.fulfilled, (state, action) => {
        state.loading = false;
        state.passes = Array.isArray(action.payload.data) ? action.payload.data : [];
        state.totalCount = action.payload.total || 0;
        state.totalInward = action.payload.totalInward || 0;
        state.totalOutward = action.payload.totalOutward || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
      })
      .addCase(fetchGatePasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Gate Pass
      .addCase(createGatePass.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createGatePass.fulfilled, (state, action) => {
        state.submitting = false;
        state.passes.unshift(action.payload);
      })
      .addCase(createGatePass.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Time Out
      .addCase(recordTimeOut.fulfilled, (state, action) => {
        const index = state.passes.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.passes[index] = action.payload;
        }
      });
  },
});

export const { setSearch, setActiveTab, setCurrentPage, setLimit, clearError } = gatePassSlice.actions;
export default gatePassSlice.reducer;
