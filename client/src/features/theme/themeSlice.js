import { createSlice } from "@reduxjs/toolkit";

const THEME_KEY = "sapaku-theme";

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch (_) {}
  return "light";
};

const initialState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
      setTheme: (state, action) => {
        const mode = action.payload === "dark" ? "dark" : "light";
        state.mode = mode;
        try {
          localStorage.setItem(THEME_KEY, mode);
        } catch (_) {}
      },
      toggleTheme: (state) => {
        state.mode = state.mode === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(THEME_KEY, state.mode);
        } catch (_) {}
      },
    },
  });

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
