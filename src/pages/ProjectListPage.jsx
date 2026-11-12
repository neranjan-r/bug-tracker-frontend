import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjectLiveUpdates } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import TicketFilterBar from "../components/TicketFilterBar.jsx";
import TicketFormModal from "../components/TicketFormModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import usePageTitle from "../utils/usePageTitle.js";
import {
  PriorityBadge,
  StatusBadge,
  TypeBadge,
  UserAvatar,
} from "../components/badges.jsx";

export default function ProjectListPage() {
  const { project, role, membersList } = useProject();
  usePageTitle(`${project.title} · List`);
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const canCreateOrEdit = role === "owner" || role === "developer";

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      priority: searchParams.get("priority") || "",
      type: searchParams.get("type") || "",
      assignee: searchParams.get("assignee") || "",
      sort: searchParams.get("sort") || "",
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1),
    }),
    [searchParams]
  );

  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
        qs.set("limit", "10");

        const data = await api.get(`/projects/${project._id}/tickets?${qs.toString()}`);
        setTickets(data.tickets || []);
        setPagination(
          data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
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
      toast.success("Ticket deleted.");
      setDeleteTarget(null);
      loadTickets();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.priority ||
      filters.type ||
      filters.assignee
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tickets List</h2>
          <p className="text-xs text-slate-500">
            {pagination.total} {pagination.total === 1 ? "ticket" : "tickets"} found
          </p>
        </div>

        {canCreateOrEdit && (
          <button
            type="button"
            onClick={() => {
              setEditingTicket(null);
              setFormOpen(true);
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            + New Ticket
          </button>
        )}
      </div>

      <TicketFilterBar
        filters={filters}
        onChangeFilter={handleFilterChange}
        onClear={handleClearFilters}
        membersList={membersList}
      />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-10 rounded bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            type="button"
            onClick={loadTickets}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-base font-semibold text-slate-900">
            {hasFilters ? "No tickets match your filters" : "No tickets yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {hasFilters
              ? "Try adjusting your search or filter selections."
              : canCreateOrEdit
                ? "Create the first ticket for this project."
                : "There are no tickets in this project yet."}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>
          ) : (
            canCreateOrEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditingTicket(null);
                  setFormOpen(true);
                }}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                + New Ticket
              </button>
            )
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Created</th>
                    {canCreateOrEdit && (
                      <th className="px-4 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {tickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                        <Link
                          to={`/projects/${project._id}/tickets/${ticket._id}`}
                          className="hover:text-indigo-600 focus:outline-none focus:underline block truncate"
                        >
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <TypeBadge type={ticket.type} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={ticket.assignee} />
                            <span className="text-slate-700 truncate max-w-[130px]">
                              {ticket.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      {canCreateOrEdit && (
                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTicket(ticket);
                              setFormOpen(true);
                            }}
                            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            Edit
                          </button>
                          {canDeleteTicket(ticket) && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(ticket)}
                              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/projects/${project._id}/tickets/${ticket._id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {ticket.title}
                  </Link>
                  <TypeBadge type={ticket.type} compact />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={ticket.assignee} />
                    <span>{ticket.assignee?.name || "Unassigned"}</span>
                  </div>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>

                {canCreateOrEdit && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTicket(ticket);
                        setFormOpen(true);
                      }}
                      className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    {canDeleteTicket(ticket) && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(ticket)}
                        className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    handleFilterChange("page", String(pagination.page - 1))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    handleFilterChange("page", String(pagination.page + 1))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TicketFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projectId={project._id}
        membersList={membersList}
        ticket={editingTicket}
        onSaved={() => loadTickets()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Ticket"
        confirmLabel="Delete Ticket"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? All comments and screenshots on it will also be deleted.`
            : ""
        }
      />
    </div>
  );
}
