import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useBreadcrumbs } from "../components/AppLayout.jsx";
import Modal from "../components/Modal.jsx";
import { RoleBadge } from "../components/badges.jsx";
import usePageTitle from "../utils/usePageTitle.js";

export default function ProjectsPage() {
  usePageTitle("Projects");
  const toast = useToast();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setBreadcrumbs([{ label: "Projects" }]);
  }, [setBreadcrumbs]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/projects");
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function openNewModal() {
    setTitle("");
    setDescription("");
    setFormError("");
    setModalOpen(true);
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Project title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post("/projects", {
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Project created!");
      setModalOpen(false);
      navigate(`/projects/${data.project._id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-600">
            Select a project to manage tickets, boards, and teammates.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewModal}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          + New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading projects">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse space-y-3"
            >
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="pt-2 flex justify-between">
                <div className="h-5 w-16 rounded-full bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            type="button"
            onClick={loadProjects}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No projects yet</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create a project to start tracking bugs, tasks, and feature requests.
          </p>
          <button
            type="button"
            onClick={openNewModal}
            className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                    {project.title}
                  </h2>
                  <RoleBadge role={project.role} />
                </div>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
                  {project.description || "No description provided."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {project.ticketCount ?? 0}{" "}
                  {project.ticketCount === 1 ? "ticket" : "tickets"}
                </span>
                <span>
                  {1 + (project.members?.length || 0)}{" "}
                  {1 + (project.members?.length || 0) === 1 ? "member" : "members"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Project">
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label
              htmlFor="new-project-title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Project Title
            </label>
            <input
              id="new-project-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mobile App v2"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="new-project-description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="new-project-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project tracking?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
