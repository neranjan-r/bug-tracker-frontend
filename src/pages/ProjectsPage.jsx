import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useBreadcrumbs } from "../components/AppLayout.jsx";
import Modal from "../components/Modal.jsx";
import { AvatarStack, RoleBadge } from "../components/badges.jsx";
import {
  AlertBanner,
  Button,
  EmptyState,
  FieldLabel,
  Input,
  RelativeTime,
  Textarea,
} from "../components/ui.jsx";
import { getProjectRouteId, suggestProjectKey } from "../utils/format.js";
import usePageTitle from "../utils/usePageTitle.js";

const KEY_PATTERN = /^[A-Z]{2,5}$/;

export default function ProjectsPage() {
  usePageTitle("Projects");
  const toast = useToast();
  const navigate = useNavigate();
  const { setBreadcrumbs, setActiveProject } = useBreadcrumbs();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setActiveProject(null);
    setBreadcrumbs([{ label: "Projects" }]);
  }, [setActiveProject, setBreadcrumbs]);

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
    setKey("");
    setKeyTouched(false);
    setDescription("");
    setFormError("");
    setModalOpen(true);
  }

  function handleTitleChange(nextTitle) {
    setTitle(nextTitle);
    if (!keyTouched) {
      setKey(suggestProjectKey(nextTitle));
    }
  }

  function handleKeyChange(raw) {
    const clean = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
    setKey(clean);
    setKeyTouched(clean.length > 0);
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Project title is required.");
      return;
    }

    const normalizedKey = key.trim().toUpperCase();
    if (!KEY_PATTERN.test(normalizedKey)) {
      setFormError("Project key must be 2 to 5 capital letters (A-Z).");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post("/projects", {
        title: title.trim(),
        key: normalizedKey,
        description: description.trim(),
      });
      toast.success(`Project ${data.project.key} created`);
      setModalOpen(false);
      navigate(`/projects/${getProjectRouteId(data.project)}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold text-ink">Projects</h1>
          <p className="text-xs text-ink-muted">
            {projects.length === 1
              ? "1 workspace project"
              : `${projects.length} workspace projects`}
          </p>
        </div>
        <Button variant="primary" onClick={openNewModal}>
          <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Create project</span>
        </Button>
      </div>

      {loading ? (
        <div
          className="rounded-panel border border-line bg-surface divide-y divide-line"
          aria-label="Loading projects"
        >
          {[1, 2, 3].map((row) => (
            <div key={row} className="px-4 py-3 flex items-center gap-4 animate-pulse">
              <div className="h-4 w-12 rounded-badge bg-well" />
              <div className="h-4 w-48 rounded-badge bg-well" />
              <div className="ml-auto h-4 w-24 rounded-badge bg-well" />
            </div>
          ))}
        </div>
      ) : error ? (
        <AlertBanner message={error} onRetry={loadProjects} />
      ) : projects.length === 0 ? (
        <EmptyState
          message="No projects yet. Create the first project to track tickets."
          action={
            <Button variant="primary" onClick={openNewModal}>
              <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>Create project</span>
            </Button>
          }
        />
      ) : (
        <div className="rounded-panel border border-line bg-surface overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 border-b border-line bg-well font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            <div className="col-span-1">Key</div>
            <div className="col-span-5">Project</div>
            <div className="col-span-2">Open</div>
            <div className="col-span-2">Team</div>
            <div className="col-span-2 text-right">Updated</div>
          </div>

          <ul className="divide-y divide-line">
            {projects.map((project) => {
              const teamUsers = [
                project.owner,
                ...(project.members || []).map((m) => m.user),
              ].filter(Boolean);
              const openCount = project.openTicketCount ?? project.ticketCount ?? 0;

              return (
                <li key={project._id}>
                  <Link
                    to={`/projects/${getProjectRouteId(project)}`}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center px-4 py-3 hover:bg-well/45 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <div className="md:col-span-1 flex items-center justify-between md:block">
                      <span className="font-mono text-xs font-semibold text-accent">
                        {project.key}
                      </span>
                      <span className="md:hidden">
                        <RoleBadge role={project.role} />
                      </span>
                    </div>

                    <div className="md:col-span-5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink truncate">
                          {project.title}
                        </span>
                        <span className="hidden md:inline-flex">
                          <RoleBadge role={project.role} />
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-ink-muted truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 font-mono text-xs text-ink-muted">
                      <span className="text-ink font-medium">{openCount}</span>{" "}
                      open
                      {typeof project.ticketCount === "number" && (
                        <span className="text-ink-subtle">
                          {" "}
                          / {project.ticketCount}
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between md:justify-start">
                      <AvatarStack users={teamUsers} max={4} />
                      <span className="md:hidden">
                        <RelativeTime date={project.updatedAt || project.createdAt} />
                      </span>
                    </div>

                    <div className="hidden md:block md:col-span-2 text-right">
                      <RelativeTime date={project.updatedAt || project.createdAt} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create project"
      >
        <div className="space-y-3">
          <AlertBanner message={formError} />

          <form onSubmit={handleCreateProject} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="new-project-title">Title</FieldLabel>
                <Input
                  id="new-project-title"
                  type="text"
                  required
                  autoFocus
                  maxLength={120}
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Mobile App Sync"
                />
              </div>

              <div>
                <FieldLabel htmlFor="new-project-key">Key</FieldLabel>
                <Input
                  id="new-project-key"
                  type="text"
                  required
                  maxLength={5}
                  value={key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="MAS"
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <p className="font-mono text-[11px] text-ink-subtle -mt-1">
              2 to 5 uppercase letters used in ticket IDs like {key || "KEY"}-12.
            </p>

            <div>
              <FieldLabel htmlFor="new-project-description">
                Description
              </FieldLabel>
              <Textarea
                id="new-project-description"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope, service, or product area"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="quiet" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create project"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
