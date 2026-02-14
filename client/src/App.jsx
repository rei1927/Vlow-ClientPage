import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import { useSelector } from "react-redux";

import Loader from "./components/Loader";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";

const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserList = lazy(() => import("./pages/UserList"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const AgentList = lazy(() => import("./pages/agents/AgentList"));
const AgentBuilder = lazy(() => import("./pages/agents/AgentBuilder"));
const ConnectedPlatforms = lazy(() => import("./pages/platforms/ConnectedPlatforms"));

const AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];
function isAuthPath(pathname) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function ThemeSync() {
  const mode = useSelector((state) => state.theme?.mode ?? "light");
  const location = useLocation();
  useEffect(() => {
    const root = document.documentElement;
    const forceLight = isAuthPath(location.pathname);
    if (forceLight) {
      root.classList.remove("dark");
    } else if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode, location.pathname]);
  return null;
}

function App() {
  return (
    <>
      <BrowserRouter>
        <ThemeSync />
        {/* Suspense akan menampilkan <Loader /> selama halaman tujuan sedang dimuat */}
        <Suspense fallback={<Loader fullScreen={true} text="Memuat Halaman..." />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/change-password" element={<ChangePassword />} />

              <Route element={<MainLayout />}>
                {/* Semua route di dalam sini akan punya Sidebar */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Route User Management */}
                <Route path="/users" element={<UserList />} />

                <Route path="/ai-agents" element={<AgentList />} />
                <Route path="/ai-agents/create" element={<AgentBuilder />} />
                <Route path="/ai-agents/:id" element={<AgentBuilder />} />

                <Route path="/platforms" element={<ConnectedPlatforms />} />
              </Route>
            </Route>

            {/* Default Redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        toastOptions={{
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
          duration: 5000,
        }}
      />
    </>
  );
}

export default App;
