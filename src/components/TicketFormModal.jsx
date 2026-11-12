import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "./Modal.jsx";

export default function TicketFormModal({
  open,
  onClose,
  projectId,
  membersList = [],
  ticket = null,
  onSaved,
}) {
  const toast = useToast();
  const isEditing = Boolean(ticket);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("bug");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (ticket) {
      setTitle(ticket.title || "");
      setDescription(ticket.description || "");
      setType(ticket.type || "bug");
      setPriority(ticket.priority || "medium");
      setAssignee(ticket.assignee?._id || "");
    } else {
      setTitle("");
      setDescription("");
      setType("bug");
      setPriority("medium");
      setAssignee("");
    }
    setError("");
  }, [open, ticket]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Ticket title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        assignee: assignee || null,
      };

      let result;
      if (isEditing) {
        result = await api.put(`/tickets/${ticket._id}`, payload);
        toast.success("Ticket updated.");
      } else {
        result = await api.post(`/projects/${projectId}/tickets`, payload);
        toast.success("Ticket created.");
      }

      onSaved?.(result.ticket);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Ticket" : "New Ticket"}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="ticket-form-title"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Title
          </label>
          <input
            id="ticket-form-title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary of the bug or task"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="ticket-form-description"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="ticket-form-description"
            rows={4}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steps to reproduce, expected behavior, or details..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="ticket-form-type"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Type
            </label>
            <select
              id="ticket-form-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="task">Task</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="ticket-form-priority"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Priority
            </label>
            <select
              id="ticket-form-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="ticket-form-assignee"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Assignee
            </label>
            <select
              id="ticket-form-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            {submitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

