import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "./Modal.jsx";
import {
  AlertBanner,
  Button,
  FieldLabel,
  Input,
  Select,
  Textarea,
} from "./ui.jsx";

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
        toast.success("Ticket saved");
      } else {
        result = await api.post(`/projects/${projectId}/tickets`, payload);
        toast.success(`Ticket ${result.ticket.key} created`);
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
      title={isEditing ? `Edit ${ticket.key || "ticket"}` : "Create ticket"}
    >
      <div className="space-y-3">
        <AlertBanner message={error} />

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <FieldLabel htmlFor="ticket-form-title">Title</FieldLabel>
            <Input
              id="ticket-form-title"
              type="text"
              required
              autoFocus
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of the bug or change"
            />
          </div>

          <div>
            <FieldLabel htmlFor="ticket-form-description">Description</FieldLabel>
            <Textarea
              id="ticket-form-description"
              rows={4}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected result, actual result"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <FieldLabel htmlFor="ticket-form-type">Type</FieldLabel>
              <Select
                id="ticket-form-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="task">Task</option>
              </Select>
            </div>

            <div>
              <FieldLabel htmlFor="ticket-form-priority">Priority</FieldLabel>
              <Select
                id="ticket-form-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>

            <div>
              <FieldLabel htmlFor="ticket-form-assignee">Assignee</FieldLabel>
              <Select
                id="ticket-form-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
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
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Save"
                  : "Create ticket"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
