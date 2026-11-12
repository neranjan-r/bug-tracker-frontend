import { useMemo, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { UserAvatar } from "./badges.jsx";
import { AlertBanner, Button, RelativeTime, Textarea } from "./ui.jsx";

export default function TicketComments({
  ticketId,
  comments,
  loading,
  error,
  role,
  onRefresh,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const canComment = role === "owner" || role === "developer";

  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { topLevel, repliesByParent } = useMemo(() => {
    const parents = [];
    const repliesMap = new Map();
    for (const c of comments) {
      if (!c.parent) {
        parents.push(c);
      } else {
        const key = c.parent;
        if (!repliesMap.has(key)) repliesMap.set(key, []);
        repliesMap.get(key).push(c);
      }
    }
    return { topLevel: parents, repliesByParent: repliesMap };
  }, [comments]);

  async function handleCreateComment(e) {
    e.preventDefault();
    if (!newText.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/tickets/${ticketId}/comments`, {
        text: newText.trim(),
      });
      setNewText("");
      toast.success("Comment posted");
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateReply(e, parentId) {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      await api.post(`/tickets/${ticketId}/comments`, {
        text: replyText.trim(),
        parent: parentId,
      });
      setReplyText("");
      setReplyToId(null);
      toast.success("Reply posted");
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReplying(false);
    }
  }

  async function handleSaveEdit(e, commentId) {
    e.preventDefault();
    if (!editText.trim()) return;

    setSavingEdit(true);
    try {
      await api.put(`/comments/${commentId}`, { text: editText.trim() });
      setEditingId(null);
      setEditText("");
      toast.success("Comment saved");
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/comments/${deleteTarget._id}`);
      toast.success("Comment deleted");
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function renderCommentItem(comment, isReply = false) {
    const isAuthor = comment.author?._id === user?.id;
    const canEdit = canComment && isAuthor;
    const canDelete = isAuthor || role === "owner";
    const isEditing = editingId === comment._id;

    return (
      <div
        key={comment._id}
        className={`rounded-control border border-line p-3 ${
          isReply ? "ml-5 sm:ml-8 bg-well/40" : "bg-surface"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar user={comment.author} size="xs" />
            <span className="text-xs font-semibold text-ink truncate">
              {comment.author?.name || "Unknown member"}
            </span>
            <RelativeTime date={comment.createdAt} />
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {!isReply && canComment && (
              <button
                type="button"
                onClick={() => {
                  setReplyToId(replyToId === comment._id ? null : comment._id);
                  setReplyText("");
                }}
                className="font-medium text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:underline cursor-pointer"
              >
                Reply
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(comment._id);
                  setEditText(comment.text);
                }}
                className="font-medium text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:underline cursor-pointer"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteTarget(comment)}
                className="font-medium text-danger hover:underline focus-visible:outline-none focus-visible:underline cursor-pointer"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <form
            onSubmit={(e) => handleSaveEdit(e, comment._id)}
            className="space-y-2"
          >
            <label htmlFor={`edit-comment-${comment._id}`} className="sr-only">
              Edit comment
            </label>
            <Textarea
              id={`edit-comment-${comment._id}`}
              rows={2}
              maxLength={2000}
              required
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="quiet" size="sm" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-ink whitespace-pre-wrap break-words leading-relaxed">
            {comment.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
          Comments ({comments.length})
        </h2>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-14 rounded-control bg-well" />
          <div className="h-14 rounded-control bg-well" />
        </div>
      ) : error ? (
        <AlertBanner message={error} onRetry={onRefresh} />
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-ink-muted py-1">
          No comments yet. Add a note or repro detail below.
        </p>
      ) : (
        <div className="space-y-2.5">
          {topLevel.map((parent) => {
            const replies = repliesByParent.get(parent._id) || [];
            return (
              <div key={parent._id} className="space-y-2">
                {renderCommentItem(parent, false)}
                {replies.map((reply) => renderCommentItem(reply, true))}

                {replyToId === parent._id && canComment && (
                  <form
                    onSubmit={(e) => handleCreateReply(e, parent._id)}
                    className="ml-5 sm:ml-8 rounded-control border border-accent-border bg-accent-tint/50 p-2.5 space-y-2"
                  >
                    <label htmlFor={`reply-${parent._id}`} className="sr-only">
                      Write a reply
                    </label>
                    <Textarea
                      id={`reply-${parent._id}`}
                      rows={2}
                      maxLength={2000}
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${parent.author?.name || "comment"}`}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => setReplyToId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={replying || !replyText.trim()}
                      >
                        {replying ? "Posting..." : "Post reply"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-line">
        {canComment ? (
          <form onSubmit={handleCreateComment} className="space-y-2">
            <label
              htmlFor="new-comment-text"
              className="block text-xs font-medium text-ink-muted"
            >
              Add comment
            </label>
            <Textarea
              id="new-comment-text"
              rows={3}
              maxLength={2000}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Write a comment"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || !newText.trim()}
              >
                {submitting ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-ink-muted">
            Viewers have read-only access and cannot comment.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete comment"
        confirmLabel="Delete"
        message={
          deleteTarget && !deleteTarget.parent
            ? "This deletes the comment and its replies. This cannot be undone."
            : "This deletes the comment. This cannot be undone."
        }
      />
    </section>
  );
}
