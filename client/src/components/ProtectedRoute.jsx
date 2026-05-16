import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { connectSocket, disconnectSocket } from "../api/socket";

const ProtectedRoute = () => {
  const { user } = useSelector((state) => state.auth);

  // Connect socket when authenticated
  useEffect(() => {
    if (user) {
      connectSocket();
    }
    return () => {
      // Disconnect only if user logs out (handled by auth slice)
    };
  }, [user]);

  // Jika tidak ada user (state kosong), tendang ke Login
  if (!user) {
    disconnectSocket();
    return <Navigate to="/login" replace />;
  }

  // --- LOGIC FIRST LOGIN ---
  // Jika user isFirstLogin = true, dia HANYA boleh akses /change-password
  if (user.isFirstLogin && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Jika user sudah TIDAK FirstLogin, tapi mencoba akses /change-password, kembalikan ke dashboard
  if (!user.isFirstLogin && location.pathname === "/change-password") {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika ada, render halaman tujuan (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
