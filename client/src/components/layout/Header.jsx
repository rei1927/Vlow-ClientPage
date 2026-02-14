import { FaBars, FaSun, FaMoon } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { setTheme } from "../../features/theme/themeSlice";
import Breadcrumbs from "../Breadcrumbs";
import UserDropdown from "../UserDropdown";

const Header = ({ toggleSidebar, onLogout }) => {
  const { user } = useSelector((state) => state.auth);
  const themeMode = useSelector((state) => state.theme?.mode ?? "light");
  const dispatch = useDispatch();
  const isDark = themeMode === "dark";

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)] h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between shadow-sm transition-all">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-border)] rounded-lg transition-colors flex-shrink-0"
          aria-label="Buka menu"
        >
          <FaBars size={20} />
        </button>

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
            className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 ${
              !isDark
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
            className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 ${
              isDark
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

        <div className="h-6 sm:h-8 w-px bg-[var(--color-border)] hidden sm:block" />
        <UserDropdown user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Header;
