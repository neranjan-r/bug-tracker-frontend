import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjectLiveUpdates } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import TicketFilterBar from "../components/TicketFilterBar.jsx";
import TicketFormModal from "../components/TicketFormModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import {
  PriorityBadge,
  StatusBadge,
  TypeBadge,
  UserAvatar,
} from "../components/badges.jsx";
import { AlertBanner, Button, EmptyState, RelativeTime } from "../components/ui.jsx";
import { getProjectRouteId, getTicketRouteId } from "../utils/format.js";
import usePageTitle from "../utils/usePageTitle.js";
import {
  setPreferredProjectView,
  useTicketShortcuts,
} from "../utils/viewPrefs.js";

function SortHeader({ label, ascKey, descKey, currentSort, onSort }) {
  const isAsc = currentSort === ascKey;
  const isDesc = currentSort === descKey;
  const nextSort = isAsc ? descKey : isDesc ? "" : ascKey;

  return (
    <button
      type="button"
      onClick={() => onSort("sort", nextSort)}
      className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted hover:text-ink cursor-pointer"
    >
      <span>{label}</span>
      {isAsc && <ArrowUp size={11} strokeWidth={2} aria-hidden="true" />}
      {isDesc && <ArrowDown size={11} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}

export default function ProjectListPage() {
  const { project, role, membersList } = useProject();
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  usePageTitle(`${project.key || project.title} Tickets`);

  const projectSlug = getProjectRouteId(project);
  const canCreate = role === "owner" || role === "developer";

  const searchRef = useRef(null);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    projectTotal: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPreferredProjectView(project, "list");
  }, [project]);

  useTicketShortcuts({
    canCreate,
    onNewTicket: () => setModalOpen(true),
    searchRef,
    modalOpen: modalOpen || Boolean(deleteTarget),
  });

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      priority: searchParams.get("priority") || "",
      type: searchParams.get("type") || "",
      assignee: searchParams.get("assignee") || "",
      sort: searchParams.get("sort") || "",
      page: Number(searchParams.get("page")) || 1,
    }),
    [searchParams]
  );

  const loadTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        if (filters.search) qs.set("search", filters.search);
        if (filters.status) qs.set("status", filters.status);
        if (filters.priority) qs.set("priority", filters.priority);
        if (filters.type) qs.set("type", filters.type);
        if (filters.assignee) qs.set("assignee", filters.assignee);
        if (filters.sort) qs.set("sort", filters.sort);
        qs.set("page", String(filters.page));
        qs.set("limit", "12");

        const data = await api.get(
          `/projects/${project._id}/tickets?${qs.toString()}`
        );
        setTickets(data.tickets || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            projectTotal: 0,
            totalPages: 1,
          }
        );
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [project._id, filters]
  );

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useProjectLiveUpdates({
    onEvent: (eventName) => {
      if (eventName.startsWith("ticket:") || eventName.startsWith("comment:")) {
        loadTickets({ silent: true });
      }
    },
    onReconnect: () => loadTickets({ silent: true }),
  });

  const handleFilterChange = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  function canDeleteTicket(ticket) {
    if (role === "owner") return true;
    if (role === "developer") {
      return ticket.reporter?._id === user?.id;
    }
    return false;
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/tickets/${deleteTarget._id}`);
      toast.success(`Ticket ${deleteTarget.key || ""} deleted`.trim());
      setDeleteTarget(null);
      loadTickets({ silent: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const totalCount = pagination.total ?? tickets.length;
  const projectTotal = pagination.projectTotal ?? totalCount;
  const countSummary = `${totalCount} of ${projectTotal} tickets`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-xs text-ink-muted">
          Click any column header to sort. Press{" "}
          <kbd className="rounded-badge border border-line bg-well px-1 py-0.5 text-[10px] text-ink">
            /
          </kbd>{" "}
          to search or{" "}
          <kbd className="rounded-badge border border-line bg-well px-1 py-0.5 text-[10px] text-ink">
            C
          </kbd>{" "}
          to create a ticket.
        </p>

        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <span>Create ticket</span>
          </Button>
        )}
      </div>

      <TicketFilterBar
        filters={filters}
        onChangeFilter={handleFilterChange}
        onClear={handleClearFilters}
        membersList={membersList}
        defaultSortLabel="Newest"
        searchRef={searchRef}
        countSummary={!loading ? countSummary : ""}
      />

      {error && (
        <div className="mb-4">
          <AlertBanner message={error} onRetry={() => loadTickets()} />
        </div>
      )}

      {loading ? (
        <div className="rounded-panel border border-line bg-surface overflow-hidden">
          <div className="border-b border-line bg-well px-3 py-2 flex gap-4">
            <div className="h-3 w-12 rounded bg-line" />
            <div className="h-3 w-40 rounded bg-line" />
            <div className="h-3 w-16 rounded bg-line ml-auto" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="px-3 py-2.5 border-b border-line last:border-b-0 flex items-center gap-4"
            >
              <div className="h-3.5 w-14 rounded bg-well shrink-0" />
              <div className="h-3.5 w-2/5 rounded bg-well" />
              <div className="h-3.5 w-16 rounded bg-well ml-auto shrink-0" />
              <div className="h-3.5 w-20 rounded bg-well shrink-0" />
              <div className="h-5 w-5 rounded-badge bg-well shrink-0" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          message={
            projectTotal === 0
              ? "No tickets logged in this project yet."
              : "No tickets match the current filters."
          }
          action={
            projectTotal === 0 && canCreate ? (
              <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
                Create first ticket
              </Button>
            ) : projectTotal > 0 ? (
              <Button variant="quiet" size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="rounded-panel border border-line bg-surface overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <thead className="sticky top-0 bg-well">
              <tr>
                <th className="px-3 py-2 w-24">
                  <SortHeader
                    label="Key"
                    ascKey="key"
                    descKey="key_desc"
                    currentSort={filters.sort}
                    onSort={handleFilterChange}
                  />
                </th>
                <th className="px-3 py-2">
                  <SortHeader
                    label="Title"
                    ascKey="title"
                    descKey="title_desc"
                    currentSort={filters.sort}
                    onSort={handleFilterChange}
                  />
                </th>
                <th className="px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Type
                </th>
                <th className="px-3 py-2">
                  <SortHeader
                    label="Priority"
                    ascKey="priority"
                    descKey="priority_asc"
                    currentSort={filters.sort}
                    onSort={handleFilterChange}
                  />
                </th>
                <th className="px-3 py-2">
                  <SortHeader
                    label="Status"
                    ascKey="status"
                    descKey="status_desc"
                    currentSort={filters.sort}
                    onSort={handleFilterChange}
                  />
                </th>
                <th className="px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Assignee
                </th>
                <th className="px-3 py-2">
                  <SortHeader
                    label="Created"
                    ascKey="oldest"
                    descKey="newest"
                    currentSort={filters.sort}
                    onSort={handleFilterChange}
                  />
                </th>
                <th className="px-3 py-2 w-10 text-right font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  className="hover:bg-well/60 transition-colors duration-150"
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-ink-muted">
                    <Link
                      to={`/projects/${projectSlug}/tickets/${getTicketRouteId(ticket)}`}
                      className="hover:text-accent hover:underline"
                    >
                      {ticket.key || ticket._id.slice(-6).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-3 py-2 max-w-md">
                    <Link
                      to={`/projects/${projectSlug}/tickets/${getTicketRouteId(ticket)}`}
                      className="text-sm font-medium text-ink hover:text-accent block truncate"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <TypeBadge type={ticket.type} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <UserAvatar user={ticket.assignee} size="xs" />
                      <span className="truncate max-w-[8rem]">
                        {ticket.assignee ? ticket.assignee.name : "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <RelativeTime date={ticket.createdAt} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    {canDeleteTicket(ticket) && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(ticket)}
                        aria-label={`Delete ${ticket.key || ticket.title}`}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-badge text-ink-subtle hover:bg-danger-tint hover:text-danger transition-colors duration-150 cursor-pointer"
                      >
                        <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
          <span className="font-mono">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
            matching)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="quiet"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                handleFilterChange("page", String(pagination.page - 1))
              }
            >
              Previous
            </Button>
            <Button
              variant="quiet"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                handleFilterChange("page", String(pagination.page + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <TicketFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={project._id}
        membersList={membersList}
        onSaved={() => loadTickets({ silent: true })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={`Delete ${deleteTarget?.key || "ticket"}?`}
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}" and its comments and attachments. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete ticket"
      />
    </div>
  );
}
