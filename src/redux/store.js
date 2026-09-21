import { configureStore } from "@reduxjs/toolkit";
import gatePassReducer from "./slices/gatePassSlice";
import passCategoryReducer from "./slices/passCategorySlice";
import usersReducer from "./slices/usersSlice";
import accountsReducer from "./slices/accountsSlice";
import financeReducer from "./slices/financeSlice";

export const store = configureStore({
  reducer: {
    gatePass: gatePassReducer,
    passCategory: passCategoryReducer,
    users: usersReducer,
    accounts: accountsReducer,
    finance: financeReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});
