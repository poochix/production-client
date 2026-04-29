import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "production_stage";

const initialState = {
  stage: "sheet",
};

const ProductionSlice = createSlice({
  name: "Production",
  initialState,
  reducers: {
    setStage: (state, action) => {
      const nextStage = action.payload.toLowerCase();
      state.stage = nextStage;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, nextStage);
      }
    },
  },
});

export const { setStage } = ProductionSlice.actions;
export default ProductionSlice.reducer