import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const { user } = useSelector((state) => state.auth);

  // Jika tidak ada user (state kosong), tendang ke Login
  if (!user) {
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
