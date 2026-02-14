import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaUsers, FaRobot, FaNetworkWired, FaTimes, FaSignOutAlt } from "react-icons/fa";

const Sidebar = ({ isOpen, toggleSidebar, onLogoutClick }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[var(--sidebar-active)] text-white shadow-md"
      : "text-white/80 hover:bg-white/10 hover:text-white";

  const handleMenuClick = () => {
    if (isOpen) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-[var(--sidebar-bg)] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-black/10">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Sapaku<span className="text-[var(--sidebar-accent)]">.ai</span>
            </h1>
            {/* Tombol Close di Mobile */}
            <button onClick={toggleSidebar} className="lg:hidden text-white/70 hover:text-white">
              <FaTimes size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <ul className="p-4 space-y-2">
            <p className="px-2 text-xs font-bold text-[var(--sidebar-accent)]/50 uppercase tracking-wider mb-2">
              Main Menu
            </p>

            <li>
              <Link
                to="/dashboard"
                onClick={handleMenuClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive("/dashboard")}`}
              >
                <FaHome className="w-5 h-5" /> Dashboard
              </Link>
            </li>

            {/* Menu Khusus Admin */}
            {user && user.role === "admin" && (
              <li>
                <Link
                  to="/users"
                  onClick={handleMenuClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive("/users")}`}
                >
                  <FaUsers className="w-5 h-5" /> User Management
                </Link>
              </li>
            )}

            {/* Menu Khusus Customer (Nanti di Fase 3 & 4) */}
            {user && user.role !== "admin" && (
              <>
                <li>
                  <Link
                    to="/ai-agents"
                    onClick={handleMenuClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive("/ai-agents")}`}
                  >
                    <FaRobot className="w-5 h-5" /> AI Agents
                  </Link>
                </li>
                <li>
                  <Link
                    to="/platforms"
                    onClick={handleMenuClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive("/platforms")}`}
                  >
                    <FaNetworkWired className="w-5 h-5" /> Connected Platforms
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Footer Sidebar (User Info & Logout) */}
        <div className="p-4 bg-black/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="avatar placeholder">
              <div className="bg-[var(--sidebar-accent)] text-[var(--sidebar-bg)] rounded-full w-10 border-2 border-white/20 flex items-center justify-center">
                <span className="text-lg font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm truncate">{user?.name}</span>
              <span className="text-xs text-[var(--sidebar-accent)]/70 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={onLogoutClick}
            className="btn btn-outline btn-sm w-full border-white/30 text-white hover:bg-white hover:text-[var(--sidebar-bg)] hover:border-white transition-colors gap-2"
          >
            <FaSignOutAlt /> Keluar Aplikasi
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
