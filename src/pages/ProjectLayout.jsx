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

export function useProject() {
  return useOutletContext();
}

export default function ProjectLayout() {
  const { projectId } = useParams();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbs();
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
    } catch (err) {
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
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Join the project's Socket.io room while viewing it and re-join on reconnect
  useEffect(() => {
    if (!socket || !connected || !project?._id) return undefined;
    socket.emit("project:join", project._id);
    return () => {
      socket.emit("project:leave", project._id);
    };
  }, [socket, connected, project?._id]);

  useEffect(() => {
    if (!project) return;
    const base = `/projects/${project._id}`;
    let section = "Board";
    if (location.pathname.startsWith(`${base}/overview`)) section = "Overview";
    else if (location.pathname.startsWith(`${base}/list`)) section = "List";
    else if (location.pathname.startsWith(`${base}/members`)) section = "Members";
    else if (location.pathname.startsWith(`${base}/settings`)) section = "Settings";
    else if (location.pathname.startsWith(`${base}/tickets/`)) section = "Ticket";

    setBreadcrumbs([
      { label: "Projects", to: "/" },
      { label: project.title, to: base },
      { label: section },
    ]);
  }, [project, location.pathname, setBreadcrumbs]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-10 w-full rounded bg-slate-200" />
        <div className="h-64 w-full rounded-xl bg-white border border-slate-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto mt-8">
        <h1 className="text-xl font-bold text-slate-900">Project not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This project does not exist or you do not have access to it.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button
          type="button"
          onClick={loadProject}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { label: "Overview", to: `/projects/${project._id}/overview` },
    { label: "Board", to: `/projects/${project._id}`, end: true },
    { label: "List", to: `/projects/${project._id}/list` },
    { label: "Members", to: `/projects/${project._id}/members` },
  ];
  if (project.role === "owner") {
    tabs.push({ label: "Settings", to: `/projects/${project._id}/settings` });
  }

  const membersList = [
    ...(project.owner ? [{ user: project.owner, role: "owner" }] : []),
    ...(project.members || []),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {project.title}
            </h1>
            <RoleBadge role={project.role} />
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 mb-6 overflow-x-auto">
        <nav aria-label="Project sections" className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
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
          membersList,
          setProject,
          reloadProject: loadProject,
        }}
      />
    </div>
  );
}
