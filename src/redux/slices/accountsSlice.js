import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Pre-populated default Chart of Accounts for Pharmaceutical ERP
export const INITIAL_ACCOUNTS = [
  // ─── ASSETS (1000s) ──────────────────────────────────────────────────────────
  {
    id: "acc-ast-001",
    accountCode: "GL-AST-1010",
    accountName: "Main Cash & Petty Cash",
    accountType: "ASSET",
    accountGroup: "Cash & Cash Equivalents",
    subGroup: "Liquid Cash",
    currency: "INR",
    openingBalance: 150000,
    currentBalance: 184500,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Physical liquid cash and plant petty cash fund.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-01T10:30:00.000Z",
  },
  {
    id: "acc-ast-002",
    accountCode: "GL-AST-1020",
    accountName: "HDFC Bank - Operations Current A/C",
    accountType: "ASSET",
    accountGroup: "Cash & Cash Equivalents",
    subGroup: "Bank Accounts",
    currency: "INR",
    openingBalance: 4500000,
    currentBalance: 5820000,
    normalBalance: "DEBIT",
    isBankAccount: true,
    bankName: "HDFC Bank Ltd",
    accountNumber: "50200084729103",
    ifscCode: "HDFC0000123",
    branch: "Nariman Point, Mumbai",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Primary operational account for vendor payments and supplier wire transfers.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-05T14:20:00.000Z",
  },
  {
    id: "acc-ast-003",
    accountCode: "GL-AST-1030",
    accountName: "State Bank of India - Collection A/C",
    accountType: "ASSET",
    accountGroup: "Cash & Cash Equivalents",
    subGroup: "Bank Accounts",
    currency: "INR",
    openingBalance: 2800000,
    currentBalance: 3450000,
    normalBalance: "DEBIT",
    isBankAccount: true,
    bankName: "State Bank of India",
    accountNumber: "389201948271",
    ifscCode: "SBIN0001420",
    branch: "Commercial Branch, Ahmedabad",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Collection account for domestic and institutional hospital receipts.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-04T11:15:00.000Z",
  },
  {
    id: "acc-ast-004",
    accountCode: "GL-AST-1100",
    accountName: "Trade Debtors / Accounts Receivable",
    accountType: "ASSET",
    accountGroup: "Current Assets",
    subGroup: "Receivables",
    currency: "INR",
    openingBalance: 6200000,
    currentBalance: 7150000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Outstanding balances from domestic pharma distributors and hospital chains.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-06T16:00:00.000Z",
  },
  {
    id: "acc-ast-005",
    accountCode: "GL-AST-1200",
    accountName: "Raw Material & API Inventory",
    accountType: "ASSET",
    accountGroup: "Current Assets",
    subGroup: "Inventory",
    currency: "INR",
    openingBalance: 8900000,
    currentBalance: 9400000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "2936",
    isActive: true,
    description: "Active pharmaceutical ingredients and excipient chemical stocks.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-07T08:00:00.000Z",
  },
  {
    id: "acc-ast-006",
    accountCode: "GL-AST-1210",
    accountName: "Packing Material Inventory",
    accountType: "ASSET",
    accountGroup: "Current Assets",
    subGroup: "Inventory",
    currency: "INR",
    openingBalance: 2100000,
    currentBalance: 1950000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "7607",
    isActive: true,
    description: "Aluminium blister foil, PVC films, amber bottles, cartons, and inserts.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-06T12:00:00.000Z",
  },
  {
    id: "acc-ast-007",
    accountCode: "GL-AST-1500",
    accountName: "Manufacturing Plant & Machinery",
    accountType: "ASSET",
    accountGroup: "Fixed Assets",
    subGroup: "Property, Plant & Equipment",
    currency: "INR",
    openingBalance: 32000000,
    currentBalance: 32000000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "8479",
    isActive: true,
    description: "Tablet compression machines, fluid bed dryers, auto-coaters, and packaging lines.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },

  // ─── LIABILITIES (2000s) ─────────────────────────────────────────────────────
  {
    id: "acc-lib-001",
    accountCode: "GL-LIB-2010",
    accountName: "Trade Creditors / Accounts Payable",
    accountType: "LIABILITY",
    accountGroup: "Current Liabilities",
    subGroup: "Payables",
    currency: "INR",
    openingBalance: 4800000,
    currentBalance: 5240000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Dues to active suppliers for API, excipient, and packaging material deliveries.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-05T15:45:00.000Z",
  },
  {
    id: "acc-lib-002",
    accountCode: "GL-LIB-2050",
    accountName: "GST Output Tax Payable",
    accountType: "LIABILITY",
    accountGroup: "Current Liabilities",
    subGroup: "Duties & Taxes",
    currency: "INR",
    openingBalance: 820000,
    currentBalance: 1140000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "9983",
    isActive: true,
    description: "CGST, SGST, and IGST tax collected on pharmaceutical formulations dispatch.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-07T09:00:00.000Z",
  },
  {
    id: "acc-lib-003",
    accountCode: "GL-LIB-2060",
    accountName: "Accrued Staff Payroll & Bonus",
    accountType: "LIABILITY",
    accountGroup: "Current Liabilities",
    subGroup: "Provisions & Accruals",
    currency: "INR",
    openingBalance: 2400000,
    currentBalance: 2650000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Monthly salary, PF/ESI statutory contributions, and staff welfare provisions.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-01T18:00:00.000Z",
  },
  {
    id: "acc-lib-004",
    accountCode: "GL-LIB-2200",
    accountName: "Bank Term Loan (Machinery & Plant)",
    accountType: "LIABILITY",
    accountGroup: "Non-Current Liabilities",
    subGroup: "Long Term Debt",
    currency: "INR",
    openingBalance: 18000000,
    currentBalance: 16500000,
    normalBalance: "CREDIT",
    isBankAccount: true,
    bankName: "HDFC Bank Ltd",
    accountNumber: "TL-2024-99182",
    ifscCode: "HDFC0000123",
    branch: "Nariman Point, Mumbai",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Long-term facility loan for sterile cleanroom & lyophilizer plant expansion.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-02-15T10:00:00.000Z",
  },

  // ─── EQUITY (3000s) ──────────────────────────────────────────────────────────
  {
    id: "acc-equ-001",
    accountCode: "GL-EQU-3010",
    accountName: "Paid-up Share Capital",
    accountType: "EQUITY",
    accountGroup: "Shareholders Equity",
    subGroup: "Capital",
    currency: "INR",
    openingBalance: 25000000,
    currentBalance: 25000000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Authorized and issued equity share capital.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "acc-equ-002",
    accountCode: "GL-EQU-3020",
    accountName: "Retained Earnings & Reserves",
    accountType: "EQUITY",
    accountGroup: "Shareholders Equity",
    subGroup: "Reserves & Surplus",
    currency: "INR",
    openingBalance: 12500000,
    currentBalance: 14820000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "Accumulated net operating profits reinvested in business.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },

  // ─── REVENUE / INCOME (4000s) ────────────────────────────────────────────────
  {
    id: "acc-rev-001",
    accountCode: "GL-REV-4010",
    accountName: "Domestic Formulation Sales",
    accountType: "REVENUE",
    accountGroup: "Operating Revenue",
    subGroup: "Direct Sales",
    currency: "INR",
    openingBalance: 0,
    currentBalance: 18500000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "3004",
    isActive: true,
    description: "Revenue from finished dosage formulations sold to domestic market.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-07T07:30:00.000Z",
  },
  {
    id: "acc-rev-002",
    accountCode: "GL-REV-4020",
    accountName: "Export Medicine Sales (Zero-Rated)",
    accountType: "REVENUE",
    accountGroup: "Operating Revenue",
    subGroup: "Export Sales",
    currency: "INR",
    openingBalance: 0,
    currentBalance: 9800000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "30049099",
    isActive: true,
    description: "Export shipments under Letter of Undertaking (LUT).",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-06T15:00:00.000Z",
  },
  {
    id: "acc-rev-003",
    accountCode: "GL-REV-4050",
    accountName: "Third Party Contract Manufacturing Income",
    accountType: "REVENUE",
    accountGroup: "Operating Revenue",
    subGroup: "Job Work Income",
    currency: "INR",
    openingBalance: 0,
    currentBalance: 3200000,
    normalBalance: "CREDIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "9988",
    isActive: true,
    description: "Loan-license formulation and batch packaging service fees.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-04T12:00:00.000Z",
  },

  // ─── EXPENSES (5000s) ────────────────────────────────────────────────────────
  {
    id: "acc-exp-001",
    accountCode: "GL-EXP-5010",
    accountName: "Raw Material & Chemical Consumables",
    accountType: "EXPENSE",
    accountGroup: "Cost of Goods Sold (COGS)",
    subGroup: "Direct Materials",
    currency: "INR",
    openingBalance: 0,
    currentBalance: 11200000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "2933",
    isActive: true,
    description: "Cost of API, solvent chemicals, binders, and coloring agents used in production.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-07T08:15:00.000Z",
  },
  {
    id: "acc-exp-002",
    accountCode: "GL-EXP-5050",
    accountName: "Quality Control & Analytical Testing Charges",
    accountType: "EXPENSE",
    accountGroup: "Operating Expenses",
    subGroup: "Quality & Compliance",
    currency: "INR",
    openingBalance: 0,
    currentBalance: 860000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "9983",
    isActive: true,
    description: "HPLC, GC, microbiological assays, stability chamber testing, and NABL lab fees.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-05T10:00:00.000Z",
  },
  {
    id: "acc-exp-003",
    accountCode: "GL-EXP-5100",
    accountName: "Factory Electricity, Water & Steam Utilities",
    accountType: "EXPENSE",
    accountGroup: "Operating Expenses",
    subGroup: "Plant Overhead",
    currency: "INR",
    openingBalance: 0,
    currentBalance: 1450000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    isActive: true,
    description: "HVAC power consumption, purified water (WFI) generation, and boiler fuel.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-03T17:00:00.000Z",
  },
  {
    id: "acc-exp-004",
    accountCode: "GL-EXP-5200",
    accountName: "Freight, Dispatch & Inward Cartage",
    accountType: "EXPENSE",
    accountGroup: "Operating Expenses",
    subGroup: "Logistics & Transport",
    currency: "INR",
    openingBalance: 0,
    currentBalance: 920000,
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: true,
    hsnSacCode: "9965",
    isActive: true,
    description: "Temperature-controlled refrigerated vehicle freight and courier charges.",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-03-06T14:30:00.000Z",
  },
];

// Async Thunks with API sync & Local Storage Fallback
export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { search = "", type = "ALL", group = "ALL" } = params;
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (type && type !== "ALL") query.append("type", type);
      if (group && group !== "ALL") query.append("group", group);

      const res = await fetch(`${backendUrl}/accounts?${query.toString()}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : (data.data || []);
      }
      // Return cached/persisted accounts if backend is not implemented yet
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("aspino_accounts_master");
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {}
        }
      }
      return INITIAL_ACCOUNTS;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createAccount = createAsyncThunk(
  "accounts/createAccount",
  async (accountData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountData),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        return data.account || data;
      }

      // Fallback local record creation
      const newAcc = {
        ...accountData,
        id: `acc-${Date.now()}`,
        currentBalance: Number(accountData.openingBalance || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newAcc;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateAccount = createAsyncThunk(
  "accounts/updateAccount",
  async ({ id, accountData }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountData),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        return data.account || data;
      }

      return {
        ...accountData,
        id,
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  "accounts/deleteAccount",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/accounts/${id}`, { method: "DELETE" }).catch(() => null);
      if (res && !res.ok) {
        throw new Error("Failed to delete account from server");
      }
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const accountsSlice = createSlice({
  name: "accounts",
  initialState: {
    accounts: INITIAL_ACCOUNTS,
    selectedAccount: null,
    loading: false,
    submitting: false,
    error: null,
    filterType: "ALL",
    filterGroup: "ALL",
    filterStatus: "ALL",
  },
  reducers: {
    setFilterType: (state, action) => {
      state.filterType = action.payload;
    },
    setFilterGroup: (state, action) => {
      state.filterGroup = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    setSelectedAccount: (state, action) => {
      state.selectedAccount = action.payload;
    },
    clearAccountError: (state) => {
      state.error = null;
    },
    toggleAccountStatus: (state, action) => {
      const acc = state.accounts.find((a) => a.id === action.payload);
      if (acc) {
        acc.isActive = !acc.isActive;
        acc.updatedAt = new Date().toISOString();
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_accounts_master", JSON.stringify(state.accounts));
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload && action.payload.length > 0 ? action.payload : INITIAL_ACCOUNTS;
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_accounts_master", JSON.stringify(state.accounts));
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Account
      .addCase(createAccount.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.submitting = false;
        state.accounts.unshift(action.payload);
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_accounts_master", JSON.stringify(state.accounts));
        }
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Update Account
      .addCase(updateAccount.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.accounts.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.accounts[index] = { ...state.accounts[index], ...action.payload };
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_accounts_master", JSON.stringify(state.accounts));
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Delete Account
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter((a) => a.id !== action.payload);
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_accounts_master", JSON.stringify(state.accounts));
        }
      });
  },
});

export const {
  setFilterType,
  setFilterGroup,
  setFilterStatus,
  setSelectedAccount,
  clearAccountError,
  toggleAccountStatus,
} = accountsSlice.actions;

export default accountsSlice.reducer;
