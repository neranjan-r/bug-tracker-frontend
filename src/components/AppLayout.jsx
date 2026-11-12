import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const BreadcrumbContext = createContext(null);

export function useBreadcrumbs() {
  return useContext(BreadcrumbContext);
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Projects", to: "/" }]);

  const updateBreadcrumbs = useCallback((items) => {
    setBreadcrumbs(items);
  }, []);

  // Close mobile sidebar when route changes or Escape is pressed
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100 w-64">
      <div>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">
              BT
            </span>
            <span>Bug Tracker</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            ✕
          </button>
        </div>

        <nav aria-label="Sidebar navigation" className="p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                isActive || location.pathname.startsWith("/projects")
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span aria-hidden="true">📁</span>
            <span>Projects</span>
          </NavLink>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs: updateBreadcrumbs }}>
      <div className="min-h-screen flex bg-slate-50 text-slate-900">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:shrink-0">{sidebarContent}</aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 flex h-full">{sidebarContent}</aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span aria-hidden="true" className="block text-base leading-none">
                ☰
              </span>
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm overflow-x-auto whitespace-nowrap">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <span className="text-slate-400" aria-hidden="true">
                        /
                      </span>
                    )}
                    {crumb.to && !isLast ? (
                      <Link
                        to={crumb.to}
                        className="font-medium text-slate-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={
                          isLast
                            ? "font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs"
                            : "font-medium text-slate-600"
                        }
                      >
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbContext.Provider>
  );
}

