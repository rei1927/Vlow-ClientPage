import { FaBars, FaSun, FaMoon, FaCoins, FaSpinner } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { setTheme } from "../../features/theme/themeSlice";
import Breadcrumbs from "../Breadcrumbs";
import UserDropdown from "../UserDropdown";

const defaultUsage = { conversations: 0, aiResponses: 0, maxConversations: 1000, maxAiResponses: 1000, isLoading: true };

const Header = ({ toggleSidebar, onLogout, usage = defaultUsage }) => {
  const { user, isImpersonating } = useSelector((state) => state.auth);
  const themeMode = useSelector((state) => state.theme?.mode ?? "light");
  const dispatch = useDispatch();
  const isDark = themeMode === "dark";

  return (
    <header className={`fixed ${isImpersonating ? 'top-10' : 'top-0'} left-0 right-0 z-[60] bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)] h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between shadow-sm transition-all`}>
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-border)] rounded-lg transition-colors flex-shrink-0"
          aria-label="Buka menu"
        >
          <FaBars size={20} />
        </button>

        {/* Logo - always visible */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/vlow-icon.png" alt="Vlow" className="h-7 w-7" />
          <span className="text-lg font-extrabold tracking-tight text-[var(--color-text)] hidden sm:inline">
            Vlow<span className="text-[var(--color-primary)]">.ai</span>
          </span>
        </div>

        <div className="h-6 w-px bg-[var(--color-border)] flex-shrink-0" />

        <nav className="min-w-0 flex-1" aria-label="Breadcrumb">
          <Breadcrumbs />
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Theme Toggle: pill switch */}
        <div
          role="group"
          aria-label="Pilih tema tampilan"
          className="flex items-center rounded-full p-0.5 bg-[var(--color-border)] border border-[var(--color-border)] shadow-inner"
        >
          <button
            type="button"
            onClick={() => dispatch(setTheme("light"))}
            className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 ${!isDark
              ? "bg-[var(--color-primary)] text-white shadow-md"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            aria-pressed={!isDark}
            aria-label="Mode terang"
            title="Mode terang"
          >
            <FaSun size={16} className="sm:w-4 sm:h-4" />
          </button>
          <button
            type="button"
            onClick={() => dispatch(setTheme("dark"))}
            className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 ${isDark
              ? "bg-[var(--color-primary)] text-white shadow-md"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            aria-pressed={isDark}
            aria-label="Mode gelap"
            title="Mode gelap"
          >
            <FaMoon size={16} className="sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Package Details Coin (Visible for Customers) */}
        {user?.role !== "admin" && (
          <div className="relative group flex items-center h-full">
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors"
              aria-label="Package Details"
            >
              <FaCoins size={16} className="sm:w-4 sm:h-4" />
            </button>

            {/* Tooltip Hover Box */}
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-4 space-y-3">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                  Package Details
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 font-medium tracking-wide text-[11px] uppercase">Expires</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {user?.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : "Never"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 font-medium tracking-wide text-[11px] uppercase">
                      Conversation
                    </span>
                    <span className="font-semibold flex items-center gap-1 text-gray-800 dark:text-gray-200">
                      {usage.isLoading ? (
                        <FaSpinner className="animate-spin text-gray-400" size={10} />
                      ) : (
                        usage.conversations
                      )}
                      <span className="text-gray-400 dark:text-gray-500 font-normal">/</span>
                      {usage.maxConversations}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 font-medium tracking-wide text-[11px] uppercase">
                      Ai Responses
                    </span>
                    <span className="font-semibold flex items-center gap-1 text-gray-800 dark:text-gray-200">
                      {usage.isLoading ? (
                        <FaSpinner className="animate-spin text-gray-400" size={10} />
                      ) : (
                        usage.aiResponses
                      )}
                      <span className="text-gray-400 dark:text-gray-500 font-normal">/</span>
                      {usage.maxAiResponses}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-6 sm:h-8 w-px bg-[var(--color-border)] hidden sm:block" />
        <UserDropdown user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Header;
