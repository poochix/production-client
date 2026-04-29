// src/lib/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import productionReducer from "@/features/production/productionSlice"
export const store = configureStore({
  reducer: {
     auth: authReducer,
     production: productionReducer,
  },
});