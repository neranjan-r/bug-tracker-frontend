import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart2,
  Folder,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getProjectRouteId } from "../utils/format.js";
import { UserAvatar } from "./badges.jsx";
import { Wordmark } from "./ui.jsx";

const WorkspaceContext = createContext(null);

export function useBreadcrumbs() {
  return useContext(WorkspaceContext);
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Projects", to: "/" }]);
  const [activeProject, setActiveProject] = useState(null);

  const updateBreadcrumbs = useCallback((items) => {
    setBreadcrumbs(items);
  }, []);

  const updateActiveProject = useCallback((project) => {
    setActiveProject(project);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const projectBase = activeProject
    ? `/projects/${getProjectRouteId(activeProject)}`
    : null;

  const projectLinks = activeProject
    ? [
        { label: "Board", to: `${projectBase}/board`, Icon: LayoutGrid },
        { label: "List", to: `${projectBase}/list`, Icon: List },
        { label: "Overview", to: `${projectBase}/overview`, Icon: BarChart2 },
        { label: "Members", to: `${projectBase}/members`, Icon: Users },
        ...(activeProject.role === "owner"
          ? [{ label: "Settings", to: `${projectBase}/settings`, Icon: Settings }]
          : []),
      ]
    : [];

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 border-l-2 px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
      isActive
        ? "border-accent text-ink font-medium bg-surface/60"
        : "border-transparent text-ink-muted hover:text-ink hover:bg-well-hover/60"
    }`;

  const sidebarContent = (
    <div className="flex h-full w-sidebar flex-col justify-between bg-well border-r border-line text-ink">
      <div>
        <div className="flex items-center justify-between px-4 h-topbar border-b border-line">
          <Link
            to="/"
            className="rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Wordmark />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden rounded-control p-1 text-ink-muted hover:text-ink hover:bg-well-hover cursor-pointer"
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="py-3 space-y-4">
          <div>
            <NavLink to="/" end className={navLinkClass}>
              <Folder size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>Projects</span>
            </NavLink>
          </div>

          {activeProject && (
            <div className="pt-2 border-t border-line">
              <div className="px-3 pb-2">
                <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-accent">
                  {activeProject.key}
                </span>
                <p className="text-xs font-semibold text-ink truncate mt-0.5">
                  {activeProject.title}
                </p>
              </div>
              <div className="space-y-0.5">
                {projectLinks.map(({ label, to, Icon }) => (
                  <NavLink key={to} to={to} className={navLinkClass}>
                    <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      <div className="p-3 border-t border-line">
        <div className="flex items-center gap-2.5 mb-2.5">
          <UserAvatar user={user} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate">{user?.name}</p>
            <p className="font-mono text-[11px] text-ink-muted truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-well-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer"
        >
          <LogOut size={13} strokeWidth={1.75} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <WorkspaceContext.Provider
      value={{
        breadcrumbs,
        setBreadcrumbs: updateBreadcrumbs,
        activeProject,
        setActiveProject: updateActiveProject,
      }}
    >
      <div className="min-h-screen flex bg-paper text-ink">
        <aside className="hidden lg:flex lg:shrink-0">{sidebarContent}</aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-ink/35"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 flex h-full">{sidebarContent}</aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-topbar items-center gap-3 border-b border-line bg-paper px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden rounded-control border border-line-strong bg-surface p-1.5 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer"
            >
              <Menu size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs overflow-x-auto whitespace-nowrap"
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span
                    key={`${crumb.label}-${index}`}
                    className="flex items-center gap-1.5"
                  >
                    {index > 0 && (
                      <span className="text-ink-subtle font-mono" aria-hidden="true">
                        /
                      </span>
                    )}
                    {crumb.to && !isLast ? (
                      <Link
                        to={crumb.to}
                        className={`hover:text-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-control ${
                          crumb.mono ? "font-mono" : "text-ink-muted"
                        }`}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={`${
                          crumb.mono ? "font-mono" : ""
                        } ${
                          isLast
                            ? "font-medium text-ink truncate max-w-[220px] sm:max-w-sm"
                            : "text-ink-muted"
                        }`}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 px-4 sm:px-6 py-4 max-w-6xl w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
