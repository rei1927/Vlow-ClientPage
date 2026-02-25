import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaUsers, FaRobot, FaNetworkWired, FaTimes, FaSignOutAlt, FaComments } from "react-icons/fa";

// CSS-only sidebar hover styles injected as a style tag
const sidebarStyles = `
  .sidebar-desktop {
    width: 72px;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sidebar-desktop:hover {
    width: 260px;
  }
  .sidebar-label {
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  }
  .sidebar-desktop:hover .sidebar-label {
    max-width: 180px;
    opacity: 1;
  }
  .sidebar-section-title {
    opacity: 0;
    height: 0;
    overflow: hidden;
    transition: opacity 0.2s ease, height 0.2s ease;
  }
  .sidebar-desktop:hover .sidebar-section-title {
    opacity: 1;
    height: auto;
  }
  .sidebar-menu-link {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
    transition: all 0.15s ease;
  }
  .sidebar-desktop:hover .sidebar-menu-link {
    justify-content: flex-start;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  .sidebar-footer-info {
    justify-content: center;
  }
  .sidebar-desktop:hover .sidebar-footer-info {
    justify-content: flex-start;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  .sidebar-btn {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }
  .sidebar-desktop:hover .sidebar-btn {
    justify-content: flex-start;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  @media (max-width: 1023px) {
    .sidebar-desktop {
      width: 260px !important;
    }
    .sidebar-label {
      max-width: 180px !important;
      opacity: 1 !important;
    }
    .sidebar-section-title {
      opacity: 1 !important;
      height: auto !important;
    }
    .sidebar-menu-link {
      justify-content: flex-start !important;
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
    }
    .sidebar-footer-info {
      justify-content: flex-start !important;
      padding-left: 0.5rem !important;
    }
    .sidebar-btn {
      justify-content: flex-start !important;
      padding-left: 0.75rem !important;
    }
  }
`;

const Sidebar = ({ isOpen, toggleSidebar, onLogoutClick }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[var(--sidebar-active)] text-white shadow-md"
      : "text-white/80 hover:bg-white/10 hover:text-white";

  const handleMenuClick = () => {
    if (isOpen) toggleSidebar();
  };

  const menuItems = [
    { to: "/dashboard", icon: FaHome, label: "Dashboard", show: true },
    { to: "/users", icon: FaUsers, label: "User Management", show: user?.role === "admin" },
    { to: "/chat", icon: FaComments, label: "Live Chat", show: user?.role !== "admin" },
    { to: "/ai-agents", icon: FaRobot, label: "AI Agents", show: user?.role !== "admin" },
    { to: "/platforms", icon: FaNetworkWired, label: "Connected Platforms", show: user?.role !== "admin" },
  ];

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside
        className={`
          sidebar-desktop
          fixed top-0 left-0 z-40 h-screen bg-[var(--sidebar-bg)] text-white
          flex flex-col justify-between overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div>
          <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 bg-black/10 flex-shrink-0">
            <img src="/vlow-icon.png" alt="Logo" className="h-8 w-8 flex-shrink-0" />
            <span className="sidebar-label text-xl font-extrabold tracking-tight">
              Vlow<span className="text-[var(--sidebar-accent)]">.ai</span>
            </span>
            <button onClick={toggleSidebar} className="lg:hidden ml-auto text-white/70 hover:text-white flex-shrink-0">
              <FaTimes size={18} />
            </button>
          </div>

          {/* Section Title */}
          <div className="sidebar-section-title px-5 pt-4 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">
            Main Menu
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-1 px-3 py-2">
            {menuItems.filter(m => m.show).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleMenuClick}
                  title={item.label}
                  className={`sidebar-menu-link flex items-center gap-3 h-11 rounded-xl font-medium ${isActive(item.to)}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="sidebar-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/10 border-t border-white/10">
          <div className="sidebar-footer-info flex items-center gap-3 mb-3">
            <div className="bg-[var(--sidebar-accent)] text-[var(--sidebar-bg)] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <span className="text-lg font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="sidebar-label flex flex-col">
              <span className="font-bold text-sm truncate">{user?.name}</span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={onLogoutClick}
            title="Keluar Aplikasi"
            className="sidebar-btn flex items-center gap-3 h-10 w-full rounded-xl border border-white/20 text-white/80 hover:bg-white hover:text-[var(--sidebar-bg)] hover:border-white transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4 flex-shrink-0" />
            <span className="sidebar-label text-sm font-medium">Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
