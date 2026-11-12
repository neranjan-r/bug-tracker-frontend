import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import Modal from "../components/Modal.jsx";
import usePageTitle from "../utils/usePageTitle.js";

export default function ProjectSettingsPage() {
  const { project, role, setProject } = useProject();
  usePageTitle(`${project.title} · Settings`);
  const toast = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState(project.title || "");
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(project.title || "");
    setDescription(project.description || "");
  }, [project.title, project.description]);

  if (role !== "owner") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center max-w-lg">
        <h2 className="text-lg font-semibold text-slate-900">Owner Access Only</h2>
        <p className="mt-1 text-sm text-slate-600">
          Only the project owner can modify project settings or delete the project.
        </p>
      </div>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Project title is required.");
      return;
    }

    setSaving(true);
    try {
      const data = await api.put(`/projects/${project._id}`, {
        title: title.trim(),
        description: description.trim(),
      });
      setProject(data.project);
      toast.success("Project settings saved.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(e) {
    e.preventDefault();
    if (confirmName.trim() !== project.title) return;

    setDeleting(true);
    try {
      await api.delete(`/projects/${project._id}`);
      toast.success("Project deleted.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">General Settings</h2>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="settings-project-title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Project Title
            </label>
            <input
              id="settings-project-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="settings-project-description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="settings-project-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-red-900">Danger Zone</h2>
        <p className="mt-1 text-sm text-red-700">
          Deleting this project permanently removes all tickets, comments, and uploaded screenshots.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmName("");
            setDeleteModalOpen(true);
          }}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Delete Project
        </button>
      </section>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Project"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDeleteProject} className="space-y-4">
          <p className="text-sm text-slate-600">
            This action cannot be undone. Type{" "}
            <span className="font-semibold text-slate-900">{project.title}</span>{" "}
            below to confirm deletion.
          </p>

          <div>
            <label htmlFor="confirm-delete-project" className="sr-only">
              Type project name to confirm
            </label>
            <input
              id="confirm-delete-project"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={project.title}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmName.trim() !== project.title || deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Permanently Delete"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
