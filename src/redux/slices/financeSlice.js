import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── INITIAL MOCK VOUCHERS (Double-Entry Bookkeeping) ─────────────────────────
export const INITIAL_VOUCHERS = [
  {
    id: "vch-001",
    voucherNumber: "JV-2026-001",
    voucherType: "JOURNAL",
    date: "2026-03-01",
    referenceNumber: "ADJ-MTH-02",
    narration: "Monthly depreciation provision for Plant & Machinery and cleanroom equipment.",
    status: "POSTED",
    totalAmount: 180000,
    lines: [
      {
        id: "vl-001",
        accountCode: "GL-EXP-5010",
        accountName: "Depreciation & Plant Amortization",
        accountType: "EXPENSE",
        debit: 180000,
        credit: 0,
        narration: "Depreciation on tablet compression machines",
      },
      {
        id: "vl-002",
        accountCode: "GL-AST-1500",
        accountName: "Manufacturing Plant & Machinery",
        accountType: "ASSET",
        debit: 0,
        credit: 180000,
        narration: "Accumulated depreciation credit",
      },
    ],
    createdBy: "Aspino Admin",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "vch-002",
    voucherNumber: "SV-2026-001",
    voucherType: "SALES_INVOICE",
    date: "2026-03-02",
    referenceNumber: "INV-ASP-2026-089",
    partyType: "CUSTOMER",
    partyId: "cust-001",
    partyName: "Apollo Hospital Group Pvt Ltd",
    narration: "Sales dispatch of Paracetamol 500mg (10,000 strips) & Amoxicillin 250mg (5,000 strips).",
    status: "POSTED",
    totalAmount: 420000,
    lines: [
      {
        id: "vl-003",
        accountCode: "GL-AST-1100",
        accountName: "Trade Debtors / Accounts Receivable",
        accountType: "ASSET",
        debit: 420000,
        credit: 0,
        partyName: "Apollo Hospital Group Pvt Ltd",
        narration: "Receivable for formulation dispatch INV-ASP-2026-089",
      },
      {
        id: "vl-004",
        accountCode: "GL-REV-4010",
        accountName: "Domestic Formulation Sales",
        accountType: "REVENUE",
        debit: 0,
        credit: 375000,
        narration: "Taxable sales revenue",
      },
      {
        id: "vl-005",
        accountCode: "GL-LIB-2050",
        accountName: "GST Output Tax Payable",
        accountType: "LIABILITY",
        debit: 0,
        credit: 45000,
        narration: "12% GST on pharmaceutical products",
      },
    ],
    createdBy: "Sales Dept",
    createdAt: "2026-03-02T11:30:00.000Z",
  },
  {
    id: "vch-003",
    voucherNumber: "PB-2026-001",
    voucherType: "PURCHASE_BILL",
    date: "2026-03-03",
    referenceNumber: "SUP-INV-8910",
    partyType: "SUPPLIER",
    partyId: "sup-001",
    partyName: "PharmaCorp Ltd",
    narration: "Inward shipment of 500 KG Paracetamol Active Pharmaceutical Ingredient (API).",
    status: "POSTED",
    totalAmount: 560000,
    lines: [
      {
        id: "vl-006",
        accountCode: "GL-AST-1200",
        accountName: "Raw Material & API Inventory",
        accountType: "ASSET",
        debit: 500000,
        credit: 0,
        narration: "Batch API inward receipt",
      },
      {
        id: "vl-007",
        accountCode: "GL-AST-1100",
        accountName: "GST Input Tax Credit Receivable",
        accountType: "ASSET",
        debit: 60000,
        credit: 0,
        narration: "12% Input GST credit",
      },
      {
        id: "vl-008",
        accountCode: "GL-LIB-2010",
        accountName: "Trade Creditors / Accounts Payable",
        accountType: "LIABILITY",
        debit: 0,
        credit: 560000,
        partyName: "PharmaCorp Ltd",
        narration: "Payable to PharmaCorp Ltd for raw material delivery",
      },
    ],
    createdBy: "Stores Dept",
    createdAt: "2026-03-03T14:15:00.000Z",
  },
  {
    id: "vch-004",
    voucherNumber: "RV-2026-001",
    voucherType: "RECEIPT",
    date: "2026-03-04",
    referenceNumber: "NEFT-APOLLO-9921",
    partyType: "CUSTOMER",
    partyId: "cust-001",
    partyName: "Apollo Hospital Group Pvt Ltd",
    bankName: "HDFC Bank Ltd",
    accountNumber: "50200084729103",
    narration: "Received payment via NEFT against Invoice INV-ASP-2026-089.",
    status: "POSTED",
    totalAmount: 420000,
    lines: [
      {
        id: "vl-009",
        accountCode: "GL-AST-1020",
        accountName: "HDFC Bank - Operations Current A/C",
        accountType: "ASSET",
        debit: 420000,
        credit: 0,
        narration: "Direct NEFT bank credit",
      },
      {
        id: "vl-010",
        accountCode: "GL-AST-1100",
        accountName: "Trade Debtors / Accounts Receivable",
        accountType: "ASSET",
        debit: 0,
        credit: 420000,
        partyName: "Apollo Hospital Group Pvt Ltd",
        narration: "Settlement of customer invoice",
      },
    ],
    createdBy: "Finance Accounts",
    createdAt: "2026-03-04T15:00:00.000Z",
  },
  {
    id: "vch-005",
    voucherNumber: "PV-2026-001",
    voucherType: "PAYMENT",
    date: "2026-03-05",
    referenceNumber: "RTGS-PHARMACORP-124",
    partyType: "SUPPLIER",
    partyId: "sup-001",
    partyName: "PharmaCorp Ltd",
    bankName: "HDFC Bank Ltd",
    accountNumber: "50200084729103",
    narration: "Vendor disbursement via RTGS for supplier bill SUP-INV-8910.",
    status: "POSTED",
    totalAmount: 560000,
    lines: [
      {
        id: "vl-011",
        accountCode: "GL-LIB-2010",
        accountName: "Trade Creditors / Accounts Payable",
        accountType: "LIABILITY",
        debit: 560000,
        credit: 0,
        partyName: "PharmaCorp Ltd",
        narration: "Payment clearance for API deliveries",
      },
      {
        id: "vl-012",
        accountCode: "GL-AST-1020",
        accountName: "HDFC Bank - Operations Current A/C",
        accountType: "ASSET",
        debit: 0,
        credit: 560000,
        narration: "RTGS payment transfer",
      },
    ],
    createdBy: "Finance Accounts",
    createdAt: "2026-03-05T16:30:00.000Z",
  },
  {
    id: "vch-006",
    voucherNumber: "CV-2026-001",
    voucherType: "CONTRA",
    date: "2026-03-06",
    referenceNumber: "TRF-SBI-HDFC",
    bankName: "State Bank of India",
    narration: "Inter-bank fund transfer from SBI Collection A/C to HDFC Operations A/C.",
    status: "POSTED",
    totalAmount: 800000,
    lines: [
      {
        id: "vl-013",
        accountCode: "GL-AST-1020",
        accountName: "HDFC Bank - Operations Current A/C",
        accountType: "ASSET",
        debit: 800000,
        credit: 0,
        narration: "Inter-bank fund inward",
      },
      {
        id: "vl-014",
        accountCode: "GL-AST-1030",
        accountName: "State Bank of India - Collection A/C",
        accountType: "ASSET",
        debit: 0,
        credit: 800000,
        narration: "Transfer out from collection balance",
      },
    ],
    createdBy: "Finance Accounts",
    createdAt: "2026-03-06T10:45:00.000Z",
  },
  {
    id: "vch-007",
    voucherNumber: "PV-2026-002",
    voucherType: "PAYMENT",
    date: "2026-03-07",
    referenceNumber: "BILL-UTILITY-FEB",
    narration: "Plant electricity and steam power utility payment.",
    status: "POSTED",
    totalAmount: 145000,
    lines: [
      {
        id: "vl-015",
        accountCode: "GL-EXP-5100",
        accountName: "Factory Electricity, Water & Steam Utilities",
        accountType: "EXPENSE",
        debit: 145000,
        credit: 0,
        narration: "Monthly power bill for HVAC and sterile plant",
      },
      {
        id: "vl-016",
        accountCode: "GL-AST-1020",
        accountName: "HDFC Bank - Operations Current A/C",
        accountType: "ASSET",
        debit: 0,
        credit: 145000,
        narration: "Direct utility auto-debit",
      },
    ],
    createdBy: "Admin Accounts",
    createdAt: "2026-03-07T09:15:00.000Z",
  },
];

// Async Thunks for Vouchers
export const fetchVouchers = createAsyncThunk(
  "finance/fetchVouchers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/vouchers`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : (data.data || []);
      }
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("aspino_finance_vouchers");
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {}
        }
      }
      return INITIAL_VOUCHERS;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createVoucher = createAsyncThunk(
  "finance/createVoucher",
  async (voucherData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherData),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        return data.voucher || data;
      }

      const newVoucher = {
        ...voucherData,
        id: `vch-${Date.now()}`,
        status: voucherData.status || "POSTED",
        createdAt: new Date().toISOString(),
      };
      return newVoucher;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteVoucher = createAsyncThunk(
  "finance/deleteVoucher",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${backendUrl}/vouchers/${id}`, { method: "DELETE" }).catch(() => null);
      if (res && !res.ok) throw new Error("Failed to delete voucher");
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const financeSlice = createSlice({
  name: "finance",
  initialState: {
    vouchers: INITIAL_VOUCHERS,
    selectedVoucher: null,
    loading: false,
    submitting: false,
    error: null,
    filterType: "ALL",
    dateRange: { from: "", to: "" },
  },
  reducers: {
    setFilterType: (state, action) => {
      state.filterType = action.payload;
    },
    setSelectedVoucher: (state, action) => {
      state.selectedVoucher = action.payload;
    },
    clearFinanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVouchers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVouchers.fulfilled, (state, action) => {
        state.loading = false;
        state.vouchers = action.payload && action.payload.length > 0 ? action.payload : INITIAL_VOUCHERS;
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_finance_vouchers", JSON.stringify(state.vouchers));
        }
      })
      .addCase(fetchVouchers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createVoucher.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createVoucher.fulfilled, (state, action) => {
        state.submitting = false;
        state.vouchers.unshift(action.payload);
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_finance_vouchers", JSON.stringify(state.vouchers));
        }
      })
      .addCase(createVoucher.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      .addCase(deleteVoucher.fulfilled, (state, action) => {
        state.vouchers = state.vouchers.filter((v) => v.id !== action.payload);
        if (typeof window !== "undefined") {
          localStorage.setItem("aspino_finance_vouchers", JSON.stringify(state.vouchers));
        }
      });
  },
});

export const { setFilterType, setSelectedVoucher, clearFinanceError } = financeSlice.actions;
export default financeSlice.reducer;
