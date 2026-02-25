import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, reset } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";
import Sidebar from "./Sidebar";
import Header from "./Header";
import QuotaOverlay from "./QuotaOverlay";
import ConfirmationModal from "../ConfirmationModal";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading } = useSelector((state) => state.auth);

  // Centralized usage state (shared between Header & QuotaOverlay)
  const [usage, setUsage] = useState({
    conversations: 0,
    aiResponses: 0,
    maxConversations: 1000,
    maxAiResponses: 1000,
    isLoading: true,
  });

  useEffect(() => {
    const fetchUsage = async () => {
      if (user && user.role === "customer") {
        setUsage((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await axiosInstance.get("/analytics/usage");
          if (res.data?.success) {
            setUsage({
              conversations: res.data.data.usedConversations || 0,
              aiResponses: res.data.data.usedAiResponses || 0,
              maxConversations: res.data.data.maxConversations || 1000,
              maxAiResponses: res.data.data.maxAiResponses || 1000,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Failed to fetch usage:", error);
          setUsage((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        // Admin or no user — no usage data needed
        setUsage((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchUsage();
  }, [user]);

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
          lg:pl-20
          transition-all duration-300 ease-in-out
        "
      >
        {/* Header: pass usage data for coin tooltip */}
        <Header
          toggleSidebar={toggleSidebar}
          onLogout={() => setIsLogoutModalOpen(true)}
          usage={usage}
        />

        {/* Page Content */}
        <main className="flex-1 px-4 pt-6 pb-21 sm:px-6 lg:px-8 overflow-y-auto bg-[var(--color-bg)]">
          {/* CONTAINER */}
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* QUOTA / SUBSCRIPTION OVERLAY (Customer Only) */}
      <QuotaOverlay user={user} usage={usage} />

      {/* GLOBAL LOGOUT MODAL  */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Logout"
        message="Apakah kamu ingin keluar dari aplikasi?"
        variant="danger"
        confirmText="Keluar"
        cancelText="Batal"
        isLoading={isLoading}
      />
    </div>
  );
};

export default MainLayout;

