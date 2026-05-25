import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHome, FaUsers, FaRobot, FaNetworkWired, FaTimes, FaSignOutAlt, FaComments, FaBullhorn, FaHeartbeat, FaAddressBook, FaChevronDown, FaChevronUp } from "react-icons/fa";

const sidebarStyles = `
  /* ===== SIDEBAR BASE ===== */
  @media (min-width: 1024px) {
    .sidebar-root {
      width: 72px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: width;
    }
    .sidebar-root:hover {
      width: 256px;
    }

    /* Labels: hidden by default, shown on hover */
    .sidebar-root .sb-label {
      width: 0;
      opacity: 0;
      overflow: hidden;
      white-space: nowrap;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 0.25s ease 0.05s;
      pointer-events: none;
    }
    .sidebar-root:hover .sb-label {
      width: 160px;
      opacity: 1;
      pointer-events: auto;
    }

    /* Menu links: icon centered when collapsed */
    .sidebar-root .sb-link {
      justify-content: center;
      gap: 0;
      transition: justify-content 0.3s, gap 0.3s;
    }
    .sidebar-root:hover .sb-link {
      justify-content: flex-start;
      gap: 12px;
      padding-left: 20px;
    }

    /* Section title hidden when collapsed */
    .sidebar-root .sb-section {
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      margin: 0;
      padding: 0;
      transition: opacity 0.2s, max-height 0.2s;
    }
    .sidebar-root:hover .sb-section {
      opacity: 1;
      max-height: 40px;
      padding: 16px 20px 4px;
    }

    /* Footer: center avatar when collapsed */
    .sidebar-root .sb-footer-row {
      justify-content: center;
      gap: 0;
    }
    .sidebar-root:hover .sb-footer-row {
      justify-content: flex-start;
      gap: 12px;
      padding-left: 12px;
      padding-right: 12px;
    }

    /* Logout button */
    .sidebar-root .sb-logout {
      justify-content: center;
      gap: 0;
    }
    .sidebar-root:hover .sb-logout {
      justify-content: flex-start;
      gap: 12px;
      padding-left: 16px;
    }
  }

  /* ===== MOBILE: always expanded ===== */
  @media (max-width: 1023px) {
    .sidebar-root {
      width: 260px !important;
    }
    .sidebar-root .sb-label {
      width: auto !important;
      opacity: 1 !important;
    }
    .sidebar-root .sb-link {
      justify-content: flex-start !important;
      gap: 12px !important;
      padding-left: 20px !important;
    }
    .sidebar-root .sb-section {
      opacity: 1 !important;
      max-height: 40px !important;
      padding: 16px 20px 4px !important;
    }
    .sidebar-root .sb-footer-row {
      justify-content: flex-start !important;
      gap: 12px !important;
      padding-left: 12px !important;
    }
    .sidebar-root .sb-logout {
      justify-content: flex-start !important;
      gap: 12px !important;
      padding-left: 16px !important;
    }
  }
`;

const Sidebar = ({ isOpen, toggleSidebar, onLogoutClick }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [broadcastOpen, setBroadcastOpen] = useState(false);

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
    { to: "/system-status", icon: FaHeartbeat, label: "System Status", show: user?.role === "admin" },
    { to: "/chat", icon: FaComments, label: "Live Chat", show: user?.role !== "admin" },
    { to: "/crm", icon: FaAddressBook, label: "CRM", show: user?.role !== "admin" },
    { 
      to: "/broadcast", 
      icon: FaBullhorn, 
      label: "Broadcast", 
      show: user?.role !== "admin",
      subItems: [
        { to: "/broadcast/meta", label: "Official (Meta)" },
        { to: "/broadcast/unofficial", label: "Unofficial (WAHA)" }
      ]
    },
    { to: "/ai-agents", icon: FaRobot, label: "AI Agents", show: user?.role !== "admin" },
    { to: "/platforms", icon: FaNetworkWired, label: "Connected Platforms", show: user?.role !== "admin" },
  ];

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-[45] bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside
        className={`
          sidebar-root
          fixed top-14 sm:top-16 left-0 z-[50] bg-[var(--sidebar-bg)] text-white
          flex flex-col justify-between overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{ height: 'calc(100vh - 3.5rem)' }}
      >
        {/* Mobile close button */}
        <div>
          <div className="lg:hidden flex items-center justify-end px-4 py-2 border-b border-white/10">
            <button onClick={toggleSidebar} className="text-white/70 hover:text-white">
              <FaTimes size={18} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-1 px-3 py-2">
            {menuItems.filter(m => m.show).map((item) => {
              const Icon = item.icon;
              if (item.subItems) {
                const isSubActive = item.subItems.some(sub => location.pathname === sub.to || location.pathname.startsWith(sub.to + "/"));
                return (
                  <div key={item.label} className="flex flex-col">
                    <button
                      onClick={() => setBroadcastOpen(!broadcastOpen)}
                      className={`sb-link flex items-center h-11 w-full rounded-xl font-medium transition-colors ${isSubActive && !broadcastOpen ? "bg-white/10 text-white shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="sb-label flex items-center justify-between pr-4">
                        <span>{item.label}</span>
                        {broadcastOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                      </span>
                    </button>
                    <div className={`sb-label flex flex-col gap-1 overflow-hidden transition-all duration-300 ${broadcastOpen ? "mt-1 pl-[44px] max-h-40" : "max-h-0"}`}>
                      {item.subItems.map(sub => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={handleMenuClick}
                          className={`flex items-center h-9 rounded-xl text-sm font-medium transition-colors ${isActive(sub.to)} px-3`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={handleMenuClick}
                  title={item.label}
                  className={`sb-link flex items-center h-11 rounded-xl font-medium transition-colors ${isActive(item.to)}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="sb-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/10 border-t border-white/10">
          <div className="sb-footer-row flex items-center mb-3">
            <div className="bg-[var(--sidebar-accent)] text-[var(--sidebar-bg)] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <span className="text-lg font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="sb-label flex flex-col">
              <span className="font-bold text-sm truncate">{user?.name}</span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={onLogoutClick}
            title="Keluar Aplikasi"
            className="sb-logout flex items-center h-10 w-full rounded-xl border border-white/20 text-white/80 hover:bg-white hover:text-[var(--sidebar-bg)] hover:border-white transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4 flex-shrink-0" />
            <span className="sb-label text-sm font-medium">Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
