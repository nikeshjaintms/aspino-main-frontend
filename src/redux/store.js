import { configureStore } from "@reduxjs/toolkit";
import gatePassReducer from "./slices/gatePassSlice";
import passCategoryReducer from "./slices/passCategorySlice";

export const store = configureStore({
  reducer: {
    gatePass: gatePassReducer,
    passCategory: passCategoryReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});
