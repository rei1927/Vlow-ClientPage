import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; // Tambah useSelector
import { logoutUser, reset } from "../../features/auth/authSlice";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ConfirmationModal from "../ConfirmationModal"; // Pastikan path import benar

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Ambil status loading dari auth state agar tombol modal bisa loading
  const { isLoading } = useSelector((state) => state.auth);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogoutConfirm = async () => {
    await dispatch(logoutUser());
    dispatch(reset());
    navigate("/login");
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans overflow-x-hidden transition-colors">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Content */}
      <div
        className="
          flex flex-col min-h-screen
          lg:pl-72
          transition-all duration-300 ease-in-out
        "
      >
        {/* Header: Kita oper fungsi buka modal ke Header */}
        <Header toggleSidebar={toggleSidebar} onLogout={() => setIsLogoutModalOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 px-4 pt-6 pb-21 sm:px-6 lg:px-8 overflow-y-auto bg-[var(--color-bg)]">
          {/* CONTAINER */}
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* GLOBAL LOGOUT MODAL  */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Logout"
        message="Apakah kamu ingin keluar dari aplikasi?"
        variant="danger" // Merah (Visual)
        confirmText="Keluar" // Teks Tombol Khusus Logout
        cancelText="Batal"
        isLoading={isLoading}
      />
    </div>
  );
};

export default MainLayout;
