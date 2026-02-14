import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import userReducer from "../features/users/userSlice";
import agentReducer from "../features/agents/agentSlice";
import platformReducer from "../features/platforms/platformSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import themeReducer from "../features/theme/themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    agents: agentReducer,
    platforms: platformReducer,
    dashboard: dashboardReducer,
    theme: themeReducer,
  },
});
