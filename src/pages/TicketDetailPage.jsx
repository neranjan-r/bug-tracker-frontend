import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjectLiveUpdates } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import TicketFormModal from "../components/TicketFormModal.jsx";
import TicketComments from "../components/TicketComments.jsx";
import TicketAttachments from "../components/TicketAttachments.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import {
  PriorityBadge,
  StatusBadge,
  TypeBadge,
  UserAvatar,
} from "../components/badges.jsx";
import {
  AlertBanner,
  Button,
  FieldLabel,
  RelativeTime,
  Select,
} from "../components/ui.jsx";
import { getProjectRouteId } from "../utils/format.js";
import usePageTitle from "../utils/usePageTitle.js";
import { getPreferredProjectView } from "../utils/viewPrefs.js";

export default function TicketDetailPage() {
  const { projectId, ticketId } = useParams();
  const { project, role, membersList } = useProject();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const projectSlug = getProjectRouteId(project);
  const backView = getPreferredProjectView(projectId);

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");

  const [savingField, setSavingField] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const ticketObjectIdRef = useRef(null);

  usePageTitle(
    ticket ? `${ticket.key || ""} ${ticket.title}`.trim() : "Ticket"
  );

  const canEdit = role === "owner" || role === "developer";
  const canDelete =
    role === "owner" ||
    (role === "developer" && ticket?.reporter?._id === user?.id);

  const loadComments = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setCommentsLoading(true);
      setCommentsError("");
      try {
        const data = await api.get(`/tickets/${ticketId}/comments`);
        setComments(data.comments || []);
      } catch (err) {
        if (!silent) setCommentsError(err.message);
      } finally {
        if (!silent) setCommentsLoading(false);
      }
    },
    [ticketId]
  );

  const loadTicket = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const data = await api.get(`/tickets/${ticketId}`);
        setTicket(data.ticket);
        ticketObjectIdRef.current = data.ticket?._id || null;
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [ticketId]
  );

  useEffect(() => {
    loadTicket();
    loadComments();
  }, [loadTicket, loadComments]);

  const matchesCurrentTicket = useCallback(
    (payload) => {
      const currentObjId = ticketObjectIdRef.current;
      const upperKey = String(ticketId).toUpperCase();
      if (payload?.ticket) {
        return (
          payload.ticket._id === currentObjId ||
          payload.ticket._id === ticketId ||
          payload.ticket.key === upperKey
        );
      }
      if (payload?.ticketId) {
        return payload.ticketId === currentObjId || payload.ticketId === ticketId;
      }
      return false;
    },
    [ticketId]
  );

  useProjectLiveUpdates({
    onEvent: (eventName, payload) => {
      if (
        (eventName === "ticket:updated" || eventName === "ticket:moved") &&
        matchesCurrentTicket(payload)
      ) {
        loadTicket({ silent: true });
      } else if (
        eventName === "ticket:deleted" &&
        matchesCurrentTicket(payload)
      ) {
        toast.info("This ticket was deleted.");
        navigate(`/projects/${projectSlug}/${backView}`, { replace: true });
      } else if (
        eventName.startsWith("comment:") &&
        matchesCurrentTicket(payload)
      ) {
        loadComments({ silent: true });
      }
    },
    onReconnect: () => {
      loadTicket({ silent: true });
      loadComments({ silent: true });
    },
  });

  async function handleFieldChange(field, value) {
    if (!canEdit || !ticket) return;
    setSavingField(field);
    try {
      const data = await api.put(`/tickets/${ticket._id}`, {
        [field]: value || null,
      });
      setTicket(data.ticket);
      toast.success("Field updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingField("");
    }
  }

  async function handleDelete() {
    if (!ticket) return;
    setDeleting(true);
    try {
      await api.delete(`/tickets/${ticket._id}`);
      toast.success(`Ticket ${ticket.key || ""} deleted`.trim());
      navigate(`/projects/${projectSlug}/${backView}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 rounded bg-well" />
        <div className="h-40 rounded-panel border border-line bg-surface" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <AlertBanner
          message={error || "Ticket not found."}
          onRetry={() => loadTicket()}
        />
        <Link
          to={`/projects/${projectSlug}/${backView}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={13} strokeWidth={1.75} aria-hidden="true" />
          <span>Back to {backView}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/projects/${projectSlug}/${backView}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={13} strokeWidth={1.75} aria-hidden="true" />
          <span>Back to {backView}</span>
        </Link>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil size={13} strokeWidth={1.75} aria-hidden="true" />
              <span>Edit</span>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger-quiet"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>

      <header className="rounded-panel border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-mono text-xs font-medium text-ink-muted">
            {ticket.key || ticket._id.slice(-6).toUpperCase()}
          </span>
          <span className="text-line-strong">/</span>
          <TypeBadge type={ticket.type} />
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <span className="ml-auto font-mono text-[11px] text-ink-subtle">
            Updated <RelativeTime date={ticket.updatedAt || ticket.createdAt} />
          </span>
        </div>

        <h2 className="text-lg font-semibold text-ink leading-snug">
          {ticket.title}
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <aside className="order-1 lg:order-2 rounded-panel border border-line bg-surface p-4 space-y-3.5">
          <div>
            <FieldLabel htmlFor="detail-status">Status</FieldLabel>
            <Select
              id="detail-status"
              disabled={!canEdit || savingField === "status"}
              value={ticket.status}
              onChange={(e) => handleFieldChange("status", e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </Select>
          </div>

          <div>
            <FieldLabel htmlFor="detail-priority">Priority</FieldLabel>
            <Select
              id="detail-priority"
              disabled={!canEdit || savingField === "priority"}
              value={ticket.priority}
              onChange={(e) => handleFieldChange("priority", e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>

          <div>
            <FieldLabel htmlFor="detail-type">Type</FieldLabel>
            <Select
              id="detail-type"
              disabled={!canEdit || savingField === "type"}
              value={ticket.type}
              onChange={(e) => handleFieldChange("type", e.target.value)}
            >
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="task">Task</option>
            </Select>
          </div>

          <div>
            <FieldLabel htmlFor="detail-assignee">Assignee</FieldLabel>
            <Select
              id="detail-assignee"
              disabled={!canEdit || savingField === "assignee"}
              value={ticket.assignee?._id || ""}
              onChange={(e) => handleFieldChange("assignee", e.target.value)}
            >
              <option value="">Unassigned</option>
              {membersList.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-3 border-t border-line space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-muted">Reporter</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <UserAvatar user={ticket.reporter} size="xs" />
                <span className="font-medium text-ink truncate">
                  {ticket.reporter?.name || "Unknown"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-muted">Created</span>
              <RelativeTime date={ticket.createdAt} />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-muted">Updated</span>
              <RelativeTime date={ticket.updatedAt} />
            </div>
          </div>
        </aside>

        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
          <section className="rounded-panel border border-line bg-surface p-4">
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-2.5">
              Description
            </h3>
            {ticket.description ? (
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            ) : (
              <p className="text-sm text-ink-subtle">No description provided.</p>
            )}
          </section>

          <TicketAttachments
            ticket={ticket}
            role={role}
            onTicketUpdated={setTicket}
          />

          <TicketComments
            ticketId={ticket._id}
            comments={comments}
            loading={commentsLoading}
            error={commentsError}
            role={role}
            onRefresh={() => loadComments({ silent: true })}
          />
        </div>
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
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete ${ticket.key || "ticket"}?`}
        message={`Delete "${ticket.title}" and its comments and attachments. This cannot be undone.`}
        confirmLabel="Delete ticket"
      />
    </div>
  );
}
