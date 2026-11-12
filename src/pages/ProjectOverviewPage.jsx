import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProject } from "./ProjectLayout.jsx";
import api from "../api/client.js";
import { PriorityBadge, StatusBadge } from "../components/badges.jsx";
import { AlertBanner, Button } from "../components/ui.jsx";
import { getProjectRouteId } from "../utils/format.js";
import usePageTitle from "../utils/usePageTitle.js";

export default function ProjectOverviewPage() {
  const { project } = useProject();
  usePageTitle(`${project.key || project.title} Overview`);

  const projectSlug = getProjectRouteId(project);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/projects/${project._id}/stats`);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-panel border border-line bg-surface p-4"
            >
              <div className="h-3 w-20 rounded bg-well" />
              <div className="mt-3 h-6 w-12 rounded bg-well" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 rounded-panel border border-line bg-surface" />
          <div className="h-44 rounded-panel border border-line bg-surface" />
        </div>
      </div>
    );
  }

  if (error) {
    return <AlertBanner message={error} onRetry={loadStats} />;
  }

  const total = stats?.total || 0;
  const todoCount = stats?.byStatus?.todo || 0;
  const inProgressCount = stats?.byStatus?.["in-progress"] || 0;
  const doneCount = stats?.byStatus?.done || 0;

  const summaryCards = [
    { label: "Total tickets", value: total, tone: "text-ink" },
    { label: "To Do", value: todoCount, tone: "text-ink" },
    { label: "In Progress", value: inProgressCount, tone: "text-accent" },
    { label: "Assigned to you", value: stats?.assignedToMe || 0, tone: "text-ink" },
  ];

  const statusRows = [
    { key: "todo", count: todoCount },
    { key: "in-progress", count: inProgressCount },
    { key: "done", count: doneCount },
  ];

  const priorityRows = [
    { key: "critical", count: stats?.byPriority?.critical || 0 },
    { key: "high", count: stats?.byPriority?.high || 0 },
    { key: "medium", count: stats?.byPriority?.medium || 0 },
    { key: "low", count: stats?.byPriority?.low || 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-panel border border-line bg-surface px-4 py-3"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              {card.label}
            </p>
            <p className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${card.tone}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-panel border border-line bg-surface p-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
            <h2 className="font-mono text-[11px] uppercase tracking-wider font-medium text-ink-muted">
              By status
            </h2>
            <span className="font-mono text-xs text-ink-subtle">{total}</span>
          </div>
          <div className="divide-y divide-line">
            {statusRows.map((row) => (
              <Link
                key={row.key}
                to={`/projects/${projectSlug}/list?status=${row.key}`}
                className="flex items-center justify-between py-2 hover:bg-well/60 px-1.5 -mx-1.5 rounded-badge transition-colors duration-150"
              >
                <StatusBadge status={row.key} />
                <span className="font-mono text-xs tabular-nums text-ink">
                  {row.count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-panel border border-line bg-surface p-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
            <h2 className="font-mono text-[11px] uppercase tracking-wider font-medium text-ink-muted">
              By priority
            </h2>
            <span className="font-mono text-xs text-ink-subtle">{total}</span>
          </div>
          <div className="divide-y divide-line">
            {priorityRows.map((row) => (
              <Link
                key={row.key}
                to={`/projects/${projectSlug}/list?priority=${row.key}`}
                className="flex items-center justify-between py-2 hover:bg-well/60 px-1.5 -mx-1.5 rounded-badge transition-colors duration-150"
              >
                <PriorityBadge priority={row.key} />
                <span className="font-mono text-xs tabular-nums text-ink">
                  {row.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-panel border border-line bg-surface px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Quick navigation</p>
          <p className="text-xs text-ink-muted">
            Switch to the board to move tickets or the table to filter and sort.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/projects/${projectSlug}/board`}>
            <Button variant="quiet" size="sm">
              Open board
            </Button>
          </Link>
          <Link to={`/projects/${projectSlug}/list`}>
            <Button variant="primary" size="sm">
              Open ticket list
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
