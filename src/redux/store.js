import { configureStore } from "@reduxjs/toolkit";
import gatePassReducer from "./slices/gatePassSlice";
import passCategoryReducer from "./slices/passCategorySlice";
import usersReducer from "./slices/usersSlice";

export const store = configureStore({
  reducer: {
    gatePass: gatePassReducer,
    passCategory: passCategoryReducer,
    users: usersReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});
