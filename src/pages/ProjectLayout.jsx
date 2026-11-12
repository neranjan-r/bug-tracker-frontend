import { useCallback, useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from "react-router-dom";
import api from "../api/client.js";
import { useSocket } from "../context/SocketContext.jsx";
import { useBreadcrumbs } from "../components/AppLayout.jsx";
import { RoleBadge } from "../components/badges.jsx";
import { AlertBanner } from "../components/ui.jsx";
import { getProjectRouteId } from "../utils/format.js";

export function useProject() {
  return useOutletContext();
}

export default function ProjectLayout() {
  const { projectId } = useParams();
  const location = useLocation();
  const { setBreadcrumbs, setActiveProject } = useBreadcrumbs();
  const { socket, connected } = useSocket() || {};

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const loadProject = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");
    try {
      const data = await api.get(`/projects/${projectId}`);
      setProject(data.project);
      setActiveProject(data.project);
    } catch (err) {
      setActiveProject(null);
      if (
        err.message?.toLowerCase().includes("not found") ||
        err.message?.toLowerCase().includes("invalid project")
      ) {
        setNotFound(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, setActiveProject]);

  useEffect(() => {
    loadProject();
    return () => setActiveProject(null);
  }, [loadProject, setActiveProject]);

  useEffect(() => {
    if (project) {
      setActiveProject(project);
    }
  }, [project, setActiveProject]);

  useEffect(() => {
    if (!socket || !connected || !project?._id) return undefined;
    socket.emit("project:join", project._id);
    return () => {
      socket.emit("project:leave", project._id);
    };
  }, [socket, connected, project?._id]);

  useEffect(() => {
    if (!project) return;
    const routeId = getProjectRouteId(project);
    const base = `/projects/${routeId}`;
    let section = "Board";
    if (location.pathname.includes("/overview")) section = "Overview";
    else if (location.pathname.includes("/list")) section = "List";
    else if (location.pathname.includes("/members")) section = "Members";
    else if (location.pathname.includes("/settings")) section = "Settings";
    else if (location.pathname.includes("/tickets/")) {
      const ticketPart = location.pathname.split("/tickets/")[1] || "Ticket";
      section = ticketPart.toUpperCase();
    }

    setBreadcrumbs([
      { label: "Projects", to: "/" },
      { label: project.key || project.title, to: base, mono: Boolean(project.key) },
      { label: section, mono: location.pathname.includes("/tickets/") },
    ]);
  }, [project, location.pathname, setBreadcrumbs]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 w-56 rounded-badge bg-well" />
        <div className="h-9 w-full rounded-control bg-well" />
        <div className="h-52 w-full rounded-panel bg-surface border border-line" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-panel border border-line bg-surface p-6 max-w-md text-left">
        <p className="font-mono text-xs text-accent">404</p>
        <h1 className="mt-1 text-base font-semibold text-ink">Project not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          This project does not exist or your account does not have access.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center rounded-control bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors duration-150"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (error) {
    return <AlertBanner message={error} onRetry={loadProject} />;
  }

  const routeId = getProjectRouteId(project);
  const tabs = [
    { label: "Board", to: `/projects/${routeId}/board` },
    { label: "List", to: `/projects/${routeId}/list` },
    { label: "Overview", to: `/projects/${routeId}/overview` },
    { label: "Members", to: `/projects/${routeId}/members` },
  ];
  if (project.role === "owner") {
    tabs.push({ label: "Settings", to: `/projects/${routeId}/settings` });
  }

  const membersList = [
    ...(project.owner ? [{ user: project.owner, role: "owner" }] : []),
    ...(project.members || []),
  ];

  return (
    <div>
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-accent">
            {project.key}
          </span>
          <h1 className="text-lg font-semibold text-ink truncate">
            {project.title}
          </h1>
          <RoleBadge role={project.role} />
        </div>
        {project.description && (
          <p className="mt-0.5 text-xs text-ink-muted max-w-3xl">
            {project.description}
          </p>
        )}
      </div>

      <div className="border-b border-line mb-4 overflow-x-auto">
        <nav aria-label="Project views" className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-3 py-2 text-xs font-medium border-b-2 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  isActive
                    ? "border-accent text-ink"
                    : "border-transparent text-ink-muted hover:text-ink hover:border-line-strong"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet
        context={{
          project,
          role: project.role,
          setProject,
          reloadProject: loadProject,
          membersList,
        }}
      />
    </div>
  );
}
