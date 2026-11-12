import { useState } from "react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { RoleBadge, UserAvatar } from "../components/badges.jsx";
import usePageTitle from "../utils/usePageTitle.js";

export default function ProjectMembersPage() {
  const { project, role, setProject } = useProject();
  usePageTitle(`${project.title} · Members`);
  const toast = useToast();
  const isOwner = role === "owner";

  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState("developer");
  const [adding, setAdding] = useState(false);
  const [busyUserId, setBusyUserId] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function handleAddMember(e) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address.");
      return;
    }

    setAdding(true);
    try {
      const data = await api.post(`/projects/${project._id}/members`, {
        email: email.trim(),
        role: newRole,
      });
      setProject(data.project);
      setEmail("");
      setNewRole("developer");
      toast.success("Member added to project.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(userId, updatedRole) {
    setBusyUserId(userId);
    try {
      const data = await api.patch(
        `/projects/${project._id}/members/${userId}`,
        { role: updatedRole }
      );
      setProject(data.project);
      toast.success("Member role updated.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyUserId("");
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const data = await api.delete(
        `/projects/${project._id}/members/${removeTarget._id}`
      );
      setProject(data.project);
      toast.success(`Removed ${removeTarget.name} from the project.`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {isOwner && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Add Team Member</h2>
          <p className="mt-1 text-xs text-slate-500">
            Invite an existing Bug Tracker user by their account email.
          </p>

          <form
            onSubmit={handleAddMember}
            className="mt-4 flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <label htmlFor="member-email" className="sr-only">
                Teammate email
              </label>
              <input
                id="member-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="member-role" className="sr-only">
                Role
              </label>
              <select
                id="member-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full sm:w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {adding ? "Adding..." : "Add Member"}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Team Members ({1 + (project.members?.length || 0)})
          </h2>
        </div>

        <ul className="divide-y divide-slate-200">
          {project.owner && (
            <li className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar user={project.owner} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {project.owner.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {project.owner.email}
                  </p>
                </div>
              </div>
              <RoleBadge role="owner" />
            </li>
          )}

          {(project.members || []).map((entry) => {
            const memberUser = entry.user;
            if (!memberUser) return null;
            const isBusy = busyUserId === memberUser._id;

            return (
              <li
                key={memberUser._id}
                className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={memberUser} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {memberUser.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {memberUser.email}
                    </p>
                  </div>
                </div>

                {isOwner ? (
                  <div className="flex items-center gap-2">
                    <label htmlFor={`role-${memberUser._id}`} className="sr-only">
                      Role for {memberUser.name}
                    </label>
                    <select
                      id={`role-${memberUser._id}`}
                      value={entry.role}
                      disabled={isBusy}
                      onChange={(e) =>
                        handleRoleChange(memberUser._id, e.target.value)
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                    >
                      <option value="developer">Developer</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(memberUser)}
                      disabled={isBusy}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <RoleBadge role={entry.role} />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        loading={removing}
        title="Remove Team Member"
        confirmLabel="Remove"
        message={
          removeTarget
            ? `Remove ${removeTarget.name} from "${project.title}"? Any tickets assigned to them will become unassigned.`
            : ""
        }
      />
    </div>
  );
}
