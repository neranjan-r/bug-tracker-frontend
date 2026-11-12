import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import {
  AlertBanner,
  Button,
  FieldLabel,
  Input,
  Textarea,
} from "../components/ui.jsx";
import usePageTitle from "../utils/usePageTitle.js";

export default function ProjectSettingsPage() {
  const { project, role, setProject } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  usePageTitle(`${project.key || project.title} Settings`);

  const [title, setTitle] = useState(project.title || "");
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setTitle(project.title || "");
    setDescription(project.description || "");
  }, [project]);

  if (role !== "owner") {
    return (
      <div className="max-w-2xl">
        <AlertBanner message="Only the project owner can change settings or delete this project." />
      </div>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");

    if (!title.trim()) {
      setSaveError("Project title is required.");
      return;
    }

    setSaving(true);
    try {
      const data = await api.put(`/projects/${project._id}`, {
        title: title.trim(),
        description: description.trim(),
      });
      setProject(data.project);
      toast.success("Project settings saved");
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(e) {
    e.preventDefault();
    setDeleteError("");
    if (confirmName.trim() !== project.title) {
      setDeleteError(`Type "${project.title}" exactly to delete.`);
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/projects/${project._id}`);
      toast.success("Project deleted");
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  const ticketCount = project.ticketCount ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-panel border border-line bg-surface p-4">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-3">
          General
        </h2>

        {saveError && (
          <div className="mb-3">
            <AlertBanner message={saveError} />
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <FieldLabel htmlFor="settings-title">Project title</FieldLabel>
              <Input
                id="settings-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <FieldLabel htmlFor="settings-key">Key</FieldLabel>
              <Input
                id="settings-key"
                type="text"
                value={project.key || ""}
                disabled
                className="font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="settings-description">Description</FieldLabel>
            <Textarea
              id="settings-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short scope summary for the team"
            />
          </div>

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </section>

      <section className="rounded-panel border border-danger-border bg-danger-tint p-4">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-danger mb-1.5">
          Delete project
        </h2>
        <p className="text-sm text-ink mb-3">
          This deletes <strong>{project.title}</strong> and its{" "}
          <span className="font-mono font-medium">
            {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}
          </span>{" "}
          plus all comments and attachments. This cannot be undone.
        </p>

        {deleteError && (
          <div className="mb-3">
            <AlertBanner message={deleteError} />
          </div>
        )}

        <form onSubmit={handleDeleteProject} className="space-y-3">
          <div>
            <FieldLabel htmlFor="confirm-delete">
              Type <span className="font-mono text-ink">{project.title}</span>{" "}
              to confirm
            </FieldLabel>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={project.title}
            />
          </div>

          <Button
            type="submit"
            variant="danger"
            disabled={deleting || confirmName.trim() !== project.title}
          >
            {deleting ? "Deleting..." : "Delete project permanently"}
          </Button>
        </form>
      </section>
    </div>
  );
}
