import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useProjectLiveUpdates } from "../context/SocketContext.jsx";
import usePageTitle from "../utils/usePageTitle.js";
import { useProject } from "./ProjectLayout.jsx";

export default function ProjectOverviewPage() {
  const { project } = useProject();
  usePageTitle(`${project.title} · Overview`);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const data = await api.get(`/projects/${project._id}/stats`);
        setStats(data.stats);
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [project._id]
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useProjectLiveUpdates({
    onEvent: (eventName) => {
      if (eventName.startsWith("ticket:")) {
        loadStats({ silent: true });
      }
    },
    onReconnect: () => loadStats({ silent: true }),
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 rounded-xl border border-slate-200 bg-white p-5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button
          type="button"
          onClick={loadStats}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const total = stats?.total || 0;
  const byStatus = stats?.byStatus || { todo: 0, "in-progress": 0, done: 0 };
  const byPriority = stats?.byPriority || {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const assignedToMe = stats?.assignedToMe || 0;

  const summaryCards = [
    {
      label: "Total Tickets",
      value: total,
      to: `/projects/${project._id}/list`,
      accent: "text-slate-900",
    },
    {
      label: "Assigned to Me",
      value: assignedToMe,
      to: `/projects/${project._id}/list?assignee=me`,
      accent: "text-indigo-600",
    },
    {
      label: "In Progress",
      value: byStatus["in-progress"],
      to: `/projects/${project._id}/list?status=in-progress`,
      accent: "text-amber-600",
    },
    {
      label: "Completed (Done)",
      value: byStatus.done,
      to: `/projects/${project._id}/list?status=done`,
      accent: "text-emerald-600",
    },
  ];

  const statusRows = [
    { key: "todo", label: "To Do", count: byStatus.todo, bar: "bg-slate-400" },
    {
      key: "in-progress",
      label: "In Progress",
      count: byStatus["in-progress"],
      bar: "bg-amber-500",
    },
    { key: "done", label: "Done", count: byStatus.done, bar: "bg-emerald-500" },
  ];

  const priorityRows = [
    {
      key: "critical",
      label: "Critical",
      count: byPriority.critical,
      bar: "bg-red-500",
    },
    { key: "high", label: "High", count: byPriority.high, bar: "bg-amber-500" },
    {
      key: "medium",
      label: "Medium",
      count: byPriority.medium,
      bar: "bg-sky-500",
    },
    { key: "low", label: "Low", count: byPriority.low, bar: "bg-slate-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className={`mt-2 text-3xl font-bold ${card.accent}`}>
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900">By Status</h2>
          <div className="space-y-3">
            {statusRows.map((row) => {
              const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
              return (
                <Link
                  key={row.key}
                  to={`/projects/${project._id}/list?status=${row.key}`}
                  className="block group"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 group-hover:text-indigo-600">
                      {row.label}
                    </span>
                    <span className="text-slate-600 font-semibold">
                      {row.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${row.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900">By Priority</h2>
          <div className="space-y-3">
            {priorityRows.map((row) => {
              const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
              return (
                <Link
                  key={row.key}
                  to={`/projects/${project._id}/list?priority=${row.key}`}
                  className="block group"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 group-hover:text-indigo-600">
                      {row.label}
                    </span>
                    <span className="text-slate-600 font-semibold">
                      {row.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${row.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
