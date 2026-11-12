import { useMemo, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { UserAvatar } from "./badges.jsx";

function formatRelativeTime(dateInput) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateInput)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(dateInput).toLocaleDateString();
}

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
      toast.success("Comment posted.");
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
      toast.success("Reply posted.");
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
      toast.success("Comment updated.");
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
      setDeleteTarget(null);
      toast.success("Comment deleted.");
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
    const canDelete = (canComment && isAuthor) || role === "owner";
    const isEditing = editingId === comment._id;

    return (
      <div
        key={comment._id}
        className={`rounded-lg border border-slate-200 bg-white p-3.5 ${
          isReply ? "ml-6 sm:ml-10 bg-slate-50/70" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar user={comment.author} />
            <span className="text-sm font-semibold text-slate-900 truncate">
              {comment.author?.name || "Unknown user"}
            </span>
            <span
              className="text-xs text-slate-400"
              title={new Date(comment.createdAt).toLocaleString()}
            >
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {!isReply && canComment && (
              <button
                type="button"
                onClick={() => {
                  setReplyToId(replyToId === comment._id ? null : comment._id);
                  setReplyText("");
                }}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
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
                className="font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:underline"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteTarget(comment)}
                className="font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline"
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
            <textarea
              id={`edit-comment-${comment._id}`}
              rows={2}
              maxLength={2000}
              required
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
            {comment.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 mb-4">
        Comments ({comments.length})
      </h2>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-lg bg-slate-100" />
          <div className="h-16 rounded-lg bg-slate-100" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-2 rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">
          No comments yet. Start the discussion below.
        </p>
      ) : (
        <div className="space-y-3">
          {topLevel.map((parent) => {
            const replies = repliesByParent.get(parent._id) || [];
            return (
              <div key={parent._id} className="space-y-2">
                {renderCommentItem(parent, false)}

                {replies.map((reply) => renderCommentItem(reply, true))}

                {replyToId === parent._id && canComment && (
                  <form
                    onSubmit={(e) => handleCreateReply(e, parent._id)}
                    className="ml-6 sm:ml-10 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-2"
                  >
                    <label htmlFor={`reply-${parent._id}`} className="sr-only">
                      Write a reply
                    </label>
                    <textarea
                      id={`reply-${parent._id}`}
                      rows={2}
                      maxLength={2000}
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${parent.author?.name || "comment"}...`}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyToId(null)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={replying || !replyText.trim()}
                        className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {replying ? "Replying..." : "Post Reply"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-200">
        {canComment ? (
          <form onSubmit={handleCreateComment} className="space-y-3">
            <label
              htmlFor="new-comment-text"
              className="block text-sm font-medium text-slate-700"
            >
              Add a comment
            </label>
            <textarea
              id="new-comment-text"
              rows={3}
              maxLength={2000}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newText.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Viewers can&apos;t comment.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Comment"
        confirmLabel="Delete"
        message={
          deleteTarget && !deleteTarget.parent
            ? "Delete this comment and all of its replies?"
            : "Delete this comment?"
        }
      />
    </section>
  );
}

