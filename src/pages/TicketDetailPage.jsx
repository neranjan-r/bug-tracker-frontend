import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjectLiveUpdates } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import TicketComments from "../components/TicketComments.jsx";
import TicketAttachments from "../components/TicketAttachments.jsx";
import TicketFormModal from "../components/TicketFormModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import usePageTitle from "../utils/usePageTitle.js";
import {
  PriorityBadge,
  StatusBadge,
  TypeBadge,
  UserAvatar,
} from "../components/badges.jsx";

export default function TicketDetailPage() {
  const { projectId, ticketId } = useParams();
  const { project, role, membersList } = useProject();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const canEdit = role === "owner" || role === "developer";

  const [ticket, setTicket] = useState(null);
  usePageTitle(ticket ? ticket.title : `${project.title} · Ticket`);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");

  const [savingField, setSavingField] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");
    try {
      const data = await api.get(`/tickets/${ticketId}`);
      setTicket(data.ticket);
    } catch (err) {
      if (
        err.message?.toLowerCase().includes("not found") ||
        err.message?.toLowerCase().includes("invalid ticket")
      ) {
        setNotFound(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError("");
    try {
      const data = await api.get(`/tickets/${ticketId}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      setCommentsError(err.message);
    } finally {
      setCommentsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
    loadComments();
  }, [loadTicket, loadComments]);

  useProjectLiveUpdates({
    onEvent: (eventName, payload) => {
      if (
        (eventName === "ticket:updated" || eventName === "ticket:moved") &&
        payload?.ticket?._id === ticketId
      ) {
        setTicket(payload.ticket);
      } else if (
        eventName === "ticket:deleted" &&
        payload?.ticketId === ticketId
      ) {
        toast.error("This ticket was deleted by a teammate.");
        navigate(`/projects/${projectId}`, { replace: true });
      } else if (
        eventName.startsWith("comment:") &&
        payload?.ticketId === ticketId
      ) {
        loadComments();
      }
    },
    onReconnect: () => {
      loadTicket();
      loadComments();
    },
  });

  async function handleQuickChange(field, value) {
    if (!ticket || !canEdit) return;
    setSavingField(true);
    setSavedNotice(false);
    try {
      const data = await api.put(`/tickets/${ticket._id}`, {
        [field]: value || null,
      });
      setTicket(data.ticket);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingField(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/tickets/${ticket._id}`);
      toast.success("Ticket deleted.");
      navigate(`/projects/${projectId}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 rounded bg-slate-200" />
        <div className="h-44 rounded-xl bg-white border border-slate-200" />
        <div className="h-44 rounded-xl bg-white border border-slate-200" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-slate-900">Ticket not found</h2>
        <p className="mt-1 text-sm text-slate-600">
          This ticket may have been deleted or belongs to another project.
        </p>
        <Link
          to={`/projects/${projectId}`}
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Board
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
          onClick={loadTicket}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const canDelete =
    role === "owner" ||
    (role === "developer" && ticket.reporter?._id === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Link
            to={`/projects/${project._id}`}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Board
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to={`/projects/${project._id}/list`}
            className="font-medium text-slate-600 hover:text-slate-900"
          >
            View List
          </Link>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Edit Details
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Ticket
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <TypeBadge type={ticket.type} />
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
              {ticket.title}
            </h2>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Description
              </h3>
              {ticket.description ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                  {ticket.description}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No description provided.
                </p>
              )}
            </div>
          </section>

          <TicketAttachments
            ticket={ticket}
            role={role}
            onTicketUpdated={(updated) => setTicket(updated)}
          />

          <TicketComments
            ticketId={ticket._id}
            comments={comments}
            loading={commentsLoading}
            error={commentsError}
            role={role}
            onRefresh={() => {
              loadComments();
              loadTicket();
            }}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Details</h3>
              {savedNotice && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Saved
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="detail-status"
                className="block text-xs font-medium text-slate-500 mb-1"
              >
                Status
              </label>
              {canEdit ? (
                <select
                  id="detail-status"
                  value={ticket.status}
                  disabled={savingField}
                  onChange={(e) => handleQuickChange("status", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>

            <div>
              <label
                htmlFor="detail-priority"
                className="block text-xs font-medium text-slate-500 mb-1"
              >
                Priority
              </label>
              {canEdit ? (
                <select
                  id="detail-priority"
                  value={ticket.priority}
                  disabled={savingField}
                  onChange={(e) => handleQuickChange("priority", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <PriorityBadge priority={ticket.priority} />
              )}
            </div>

            <div>
              <label
                htmlFor="detail-assignee"
                className="block text-xs font-medium text-slate-500 mb-1"
              >
                Assignee
              </label>
              {canEdit ? (
                <select
                  id="detail-assignee"
                  value={ticket.assignee?._id || ""}
                  disabled={savingField}
                  onChange={(e) => handleQuickChange("assignee", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                >
                  <option value="">Unassigned</option>
                  {membersList.map(
                    (entry) =>
                      entry.user && (
                        <option key={entry.user._id} value={entry.user._id}>
                          {entry.user.name}
                        </option>
                      )
                  )}
                </select>
              ) : ticket.assignee ? (
                <div className="flex items-center gap-2">
                  <UserAvatar user={ticket.assignee} />
                  <span className="text-sm text-slate-800">
                    {ticket.assignee.name}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-slate-500">Unassigned</span>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
              <div>
                <span className="block text-slate-500 mb-1">Reporter</span>
                <div className="flex items-center gap-2">
                  <UserAvatar user={ticket.reporter} />
                  <span className="text-sm font-medium text-slate-800">
                    {ticket.reporter?.name || "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-700 font-medium">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Updated</span>
                <span className="text-slate-700 font-medium">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <TicketFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        projectId={project._id}
        membersList={membersList}
        ticket={ticket}
        onSaved={(updated) => setTicket(updated)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Ticket"
        confirmLabel="Delete Ticket"
        message={`Delete "${ticket.title}"? All comments and screenshots will also be removed.`}
      />
    </div>
  );
}
