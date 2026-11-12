import { useState } from "react";
import { UserPlus } from "lucide-react";
import api from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { RoleBadge, UserAvatar } from "../components/badges.jsx";
import {
  AlertBanner,
  Button,
  FieldLabel,
  Input,
  RelativeTime,
  Select,
} from "../components/ui.jsx";
import usePageTitle from "../utils/usePageTitle.js";

export default function ProjectMembersPage() {
  const { project, role, setProject } = useProject();
  const toast = useToast();
  const isOwner = role === "owner";
  usePageTitle(`${project.key || project.title} Members`);

  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState("developer");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function handleAddMember(e) {
    e.preventDefault();
    setAddError("");
    if (!email.trim()) {
      setAddError("Enter a teammate email address.");
      return;
    }

    setAdding(true);
    try {
      const data = await api.post(`/projects/${project._id}/members`, {
        email: email.trim().toLowerCase(),
        role: newRole,
      });
      setProject(data.project);
      setEmail("");
      toast.success("Member added");
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(userId, nextRole) {
    setBusyUserId(userId);
    try {
      const data = await api.patch(
        `/projects/${project._id}/members/${userId}`,
        { role: nextRole }
      );
      setProject(data.project);
      toast.success("Role updated");
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
      toast.success("Member removed");
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  }

  const members = project.members || [];

  return (
    <div className="space-y-4 max-w-4xl">
      {isOwner && (
        <section className="rounded-panel border border-line bg-surface p-4">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted mb-3">
            Add member
          </h2>

          {addError && (
            <div className="mb-3">
              <AlertBanner message={addError} />
            </div>
          )}

          <form
            onSubmit={handleAddMember}
            className="flex flex-col sm:flex-row sm:items-end gap-2.5"
          >
            <div className="flex-1">
              <FieldLabel htmlFor="member-email">Email</FieldLabel>
              <Input
                id="member-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
            </div>

            <div className="w-full sm:w-40">
              <FieldLabel htmlFor="member-role">Role</FieldLabel>
              <Select
                id="member-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </Select>
            </div>

            <Button type="submit" variant="primary" disabled={adding}>
              <UserPlus size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>{adding ? "Adding..." : "Add member"}</span>
            </Button>
          </form>
        </section>
      )}

      <section className="rounded-panel border border-line bg-surface overflow-x-auto">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Members
          </h2>
          <span className="font-mono text-xs tabular-nums text-ink-subtle">
            {members.length + 1}
          </span>
        </div>

        <table className="min-w-full divide-y divide-line text-left">
          <thead className="bg-well">
            <tr>
              <th className="px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                User
              </th>
              <th className="px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Role
              </th>
              <th className="px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Added
              </th>
              {isOwner && (
                <th className="px-4 py-2 text-right font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <UserAvatar user={project.owner} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {project.owner?.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {project.owner?.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <RoleBadge role="owner" />
              </td>
              <td className="px-4 py-2.5">
                <RelativeTime date={project.createdAt} />
              </td>
              {isOwner && (
                <td className="px-4 py-2.5 text-right text-xs text-ink-subtle">
                  Owner
                </td>
              )}
            </tr>

            {members.map((member) => {
              const memberUser = member.user;
              if (!memberUser) return null;
              const isBusy = busyUserId === memberUser._id;

              return (
                <tr key={memberUser._id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={memberUser} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {memberUser.name}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {memberUser.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {isOwner ? (
                      <Select
                        aria-label={`Role for ${memberUser.name}`}
                        disabled={isBusy}
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(memberUser._id, e.target.value)
                        }
                        className="w-32 py-1 text-xs"
                      >
                        <option value="developer">Developer</option>
                        <option value="viewer">Viewer</option>
                      </Select>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <RelativeTime date={project.createdAt} />
                  </td>
                  {isOwner && (
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        variant="danger-quiet"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => setRemoveTarget(memberUser)}
                      >
                        Remove
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        loading={removing}
        title="Remove member?"
        message={
          removeTarget
            ? `Remove ${removeTarget.name} from ${project.title}. They will lose access immediately.`
            : ""
        }
        confirmLabel="Remove member"
      />
    </div>
  );
}
