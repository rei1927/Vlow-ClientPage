import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaUsers, FaRobot, FaNetworkWired, FaTimes, FaSignOutAlt, FaComments } from "react-icons/fa";

const Sidebar = ({ isOpen, toggleSidebar, onLogoutClick }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[var(--sidebar-active)] text-white shadow-md"
      : "text-white/80 hover:bg-white/10 hover:text-white";

  const handleMenuClick = () => {
    if (isOpen) {
      toggleSidebar();
    }
  };

  // Desktop: collapsed = w-20 (icons only), expanded on hover = w-72
  const isExpanded = isHovered;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar Container */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed top-0 left-0 z-40 h-screen bg-[var(--sidebar-bg)] text-white flex flex-col justify-between
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"}
          lg:translate-x-0
          ${isExpanded ? "lg:w-72" : "lg:w-20"}
        `}
      >
        <div>
          {/* Header / Logo */}
          <div className={`h-20 flex items-center ${isExpanded ? "justify-between px-6" : "justify-center lg:px-0 px-6 lg:justify-center"} border-b border-white/10 bg-black/10`}>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <img src="/vlow-icon.png" alt="Logo" className="h-8 w-auto flex-shrink-0" />
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
                Vlow<span className="text-[var(--sidebar-accent)]">.ai</span>
              </span>
            </h1>
            {/* Tombol Close di Mobile */}
            <button onClick={toggleSidebar} className="lg:hidden text-white/70 hover:text-white">
              <FaTimes size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <ul className="p-4 space-y-2">
            <p className={`px-2 text-xs font-bold text-[var(--sidebar-accent)]/50 uppercase tracking-wider mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100" : "lg:opacity-0 lg:h-0 lg:mb-0 lg:p-0"}`}>
              Main Menu
            </p>

            <li>
              <Link
                to="/dashboard"
                onClick={handleMenuClick}
                className={`flex items-center gap-3 ${isExpanded ? "px-4" : "lg:px-0 lg:justify-center px-4"} py-3 rounded-xl transition-all font-medium ${isActive("/dashboard")}`}
                title="Dashboard"
              >
                <FaHome className="w-5 h-5 flex-shrink-0" />
                <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
                  Dashboard
                </span>
              </Link>
            </li>

            {/* Menu Khusus Admin */}
            {user && user.role === "admin" && (
              <li>
                <Link
                  to="/users"
                  onClick={handleMenuClick}
                  className={`flex items-center gap-3 ${isExpanded ? "px-4" : "lg:px-0 lg:justify-center px-4"} py-3 rounded-xl transition-all font-medium ${isActive("/users")}`}
                  title="User Management"
                >
                  <FaUsers className="w-5 h-5 flex-shrink-0" />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
                    User Management
                  </span>
                </Link>
              </li>
            )}

            {/* Menu Khusus Customer */}
            {user && user.role !== "admin" && (
              <>
                <li>
                  <Link
                    to="/chat"
                    onClick={handleMenuClick}
                    className={`flex items-center gap-3 ${isExpanded ? "px-4" : "lg:px-0 lg:justify-center px-4"} py-3 rounded-xl transition-all font-medium ${isActive("/chat")}`}
                    title="Live Chat"
                  >
                    <FaComments className="w-5 h-5 flex-shrink-0" />
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
                      Live Chat
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ai-agents"
                    onClick={handleMenuClick}
                    className={`flex items-center gap-3 ${isExpanded ? "px-4" : "lg:px-0 lg:justify-center px-4"} py-3 rounded-xl transition-all font-medium ${isActive("/ai-agents")}`}
                    title="AI Agents"
                  >
                    <FaRobot className="w-5 h-5 flex-shrink-0" />
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
                      AI Agents
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/platforms"
                    onClick={handleMenuClick}
                    className={`flex items-center gap-3 ${isExpanded ? "px-4" : "lg:px-0 lg:justify-center px-4"} py-3 rounded-xl transition-all font-medium ${isActive("/platforms")}`}
                    title="Connected Platforms"
                  >
                    <FaNetworkWired className="w-5 h-5 flex-shrink-0" />
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
                      Connected Platforms
                    </span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Footer Sidebar (User Info & Logout) */}
        <div className="p-4 bg-black/10">
          <div className={`flex items-center gap-3 mb-4 ${isExpanded ? "px-2" : "lg:px-0 lg:justify-center px-2"}`}>
            <div className="avatar placeholder">
              <div className="bg-[var(--sidebar-accent)] text-[var(--sidebar-bg)] rounded-full w-10 border-2 border-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
              <span className="font-bold text-sm truncate">{user?.name}</span>
              <span className="text-xs text-[var(--sidebar-accent)]/70 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={onLogoutClick}
            className={`btn btn-outline btn-sm w-full border-white/30 text-white hover:bg-white hover:text-[var(--sidebar-bg)] hover:border-white transition-colors gap-2 ${isExpanded ? "" : "lg:btn-circle lg:w-10 lg:h-10 lg:p-0"}`}
            title="Keluar Aplikasi"
          >
            <FaSignOutAlt className="flex-shrink-0" />
            <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? "lg:opacity-100 lg:w-auto" : "lg:opacity-0 lg:w-0"} opacity-100 w-auto`}>
              Keluar Aplikasi
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
