import { Link, useLocation, useParams } from "react-router-dom";
import { FaHome, FaChevronRight } from "react-icons/fa";

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();

  const getBreadcrumbPath = () => {
    const path = location.pathname;

    if (path === "/dashboard") return [{ label: "Dashboard", path: null }];
    if (path === "/change-password") {
      return [{ label: "Dashboard", path: "/dashboard" }, { label: "Ubah Password", path: null }];
    }
    if (path.startsWith("/ai-agents")) {
      const items = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "AI Agents", path: "/ai-agents" },
      ];
      if (path === "/ai-agents/create") items.push({ label: "Buat Agent", path: null });
      else if (params.id) items.push({ label: "Edit Agent", path: null });
      return items;
    }
    if (path.startsWith("/platforms")) {
      return [{ label: "Dashboard", path: "/dashboard" }, { label: "Connected Platforms", path: null }];
    }
    if (path.startsWith("/users")) {
      return [{ label: "Dashboard", path: "/dashboard" }, { label: "User Management", path: null }];
    }

    const pathnames = path.split("/").filter((x) => x && x !== "dashboard");
    const items = [{ label: "Dashboard", path: "/dashboard" }];
    pathnames.forEach((name, i) => {
      items.push({
        label: name.replace(/-/g, " "),
        path: i === pathnames.length - 1 ? null : `/dashboard/${pathnames.slice(0, i + 1).join("/")}`,
      });
    });
    return items;
  };

  const items = getBreadcrumbPath();

  return (
    <nav aria-label="Breadcrumb" className="min-w-0 hidden sm:block">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <FaChevronRight className="flex-shrink-0 w-3 h-3 text-[var(--color-text-muted)]/70" aria-hidden />
            )}
            {crumb.path ? (
              <Link
                to={crumb.path}
                className="truncate flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                {i === 0 ? <FaHome className="inline w-3.5 h-3.5 mr-1 align-middle" /> : null}
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate flex items-center text-[var(--color-text)] font-medium" aria-current="page">
                {i === 0 ? <FaHome className="inline w-3.5 h-3.5 mr-1 align-middle" /> : null}
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
