import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaUsers, FaRobot, FaNetworkWired, FaTimes, FaSignOutAlt, FaComments } from "react-icons/fa";

const COLLAPSED_W = 72;
const EXPANDED_W = 260;

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isDesktop;
};

const Sidebar = ({ isOpen, toggleSidebar, onLogoutClick }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const isDesktop = useIsDesktop();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[var(--sidebar-active)] text-white shadow-md"
      : "text-white/80 hover:bg-white/10 hover:text-white";

  const handleMenuClick = () => {
    if (isOpen) toggleSidebar();
  };

  const expanded = isDesktop ? isHovered : true;

  const menuItems = [
    { to: "/dashboard", icon: FaHome, label: "Dashboard", show: true },
    { to: "/users", icon: FaUsers, label: "User Management", show: user?.role === "admin" },
    { to: "/chat", icon: FaComments, label: "Live Chat", show: user?.role !== "admin" },
    { to: "/ai-agents", icon: FaRobot, label: "AI Agents", show: user?.role !== "admin" },
    { to: "/platforms", icon: FaNetworkWired, label: "Connected Platforms", show: user?.role !== "admin" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isDesktop ? (expanded ? EXPANDED_W : COLLAPSED_W) : EXPANDED_W,
        }}
        className={`
          fixed top-0 left-0 z-40 h-screen bg-[var(--sidebar-bg)] text-white
          flex flex-col justify-between overflow-hidden
          transition-[width] duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo - Always visible in header */}
        <div>
          <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 bg-black/10 flex-shrink-0">
            <img src="/vlow-icon.png" alt="Logo" className="h-8 w-8 flex-shrink-0" />
            <span
              className="text-xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-200"
              style={{
                maxWidth: expanded ? 160 : 0,
                opacity: expanded ? 1 : 0,
              }}
            >
              Vlow<span className="text-[var(--sidebar-accent)]">.ai</span>
            </span>
            <button onClick={toggleSidebar} className="lg:hidden ml-auto text-white/70 hover:text-white">
              <FaTimes size={18} />
            </button>
          </div>

          {/* Section Title */}
          <div
            className="px-5 pt-4 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap overflow-hidden transition-[opacity] duration-200"
            style={{ opacity: expanded ? 1 : 0, height: expanded ? "auto" : 0 }}
          >
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
                  className={`
                    flex items-center h-11 rounded-xl transition-all duration-150 font-medium
                    ${expanded ? "px-3 gap-3" : "justify-center px-0"}
                    ${isActive(item.to)}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className="whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-200"
                    style={{
                      maxWidth: expanded ? 180 : 0,
                      opacity: expanded ? 1 : 0,
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/10 border-t border-white/10">
          {/* User Info */}
          <div className={`flex items-center gap-3 mb-3 ${expanded ? "px-2" : "justify-center"}`}>
            <div className="bg-[var(--sidebar-accent)] text-[var(--sidebar-bg)] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <span className="text-lg font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div
              className="flex flex-col overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200"
              style={{
                maxWidth: expanded ? 160 : 0,
                opacity: expanded ? 1 : 0,
              }}
            >
              <span className="font-bold text-sm truncate">{user?.name}</span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogoutClick}
            title="Keluar Aplikasi"
            className={`
              flex items-center h-10 w-full rounded-xl border border-white/20 text-white/80
              hover:bg-white hover:text-[var(--sidebar-bg)] hover:border-white transition-all duration-150
              ${expanded ? "px-3 gap-3 justify-start" : "justify-center px-0"}
            `}
          >
            <FaSignOutAlt className="w-4 h-4 flex-shrink-0" />
            <span
              className="whitespace-nowrap overflow-hidden text-sm font-medium transition-[opacity,max-width] duration-200"
              style={{
                maxWidth: expanded ? 160 : 0,
                opacity: expanded ? 1 : 0,
              }}
            >
              Keluar Aplikasi
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
