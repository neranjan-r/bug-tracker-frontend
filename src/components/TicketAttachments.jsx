import { useRef, useState } from "react";
import { Paperclip, Trash2, Upload } from "lucide-react";
import api, { getAssetUrl, uploadWithProgress } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Modal from "./Modal.jsx";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export default function TicketAttachments({ ticket, role, onTicketUpdated }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const canEdit = role === "owner" || role === "developer";

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const [previewItem, setPreviewItem] = useState(null);
  const [removeIndex, setRemoveIndex] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function processFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setUploadError("");

    if (files.length > 5) {
      const msg = "Select up to 5 image files per upload.";
      setUploadError(msg);
      toast.error(msg);
      return;
    }

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        const msg = `"${file.name}" must be a PNG, JPG, WEBP, or GIF image.`;
        setUploadError(msg);
        toast.error(msg);
        return;
      }
      if (file.size > MAX_BYTES) {
        const msg = `"${file.name}" exceeds the 3 MB limit.`;
        setUploadError(msg);
        toast.error(msg);
        return;
      }
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("attachments", file);
    }

    setUploading(true);
    setProgress(0);
    try {
      const data = await uploadWithProgress(
        `/tickets/${ticket._id}/attachments`,
        formData,
        (pct) => setProgress(pct)
      );
      onTicketUpdated(data.ticket);
      toast.success(files.length === 1 ? "Screenshot uploaded" : "Screenshots uploaded");
    } catch (err) {
      setUploadError(err.message);
      toast.error(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleConfirmRemove() {
    if (removeIndex === null) return;
    setRemoving(true);
    try {
      const data = await api.delete(
        `/tickets/${ticket._id}/attachments/${removeIndex}`
      );
      onTicketUpdated(data.ticket);
      toast.success("Screenshot removed");
      setRemoveIndex(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  }

  const attachments = ticket.attachments || [];

  return (
    <section className="rounded-panel border border-line bg-surface p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Paperclip size={13} strokeWidth={1.75} className="text-ink-muted" aria-hidden="true" />
        <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-ink-muted">
          Screenshots ({attachments.length})
        </h2>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-ink-muted">No screenshots attached.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {attachments.map((att, index) => {
            const fullUrl = getAssetUrl(att.url);
            return (
              <div
                key={`${att.url}-${index}`}
                className="group rounded-control border border-line bg-well/50 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setPreviewItem({ ...att, fullUrl })}
                  className="block w-full aspect-video overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                  aria-label={`View ${att.filename}`}
                >
                  <img
                    src={fullUrl}
                    alt={att.filename}
                    className="h-full w-full object-cover"
                  />
                </button>
                <div className="px-2 py-1 flex items-center justify-between gap-1 bg-surface border-t border-line">
                  <span
                    className="font-mono text-[11px] text-ink-muted truncate"
                    title={att.filename}
                  >
                    {att.filename}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setRemoveIndex(index)}
                      aria-label={`Remove ${att.filename}`}
                      className="shrink-0 rounded-control p-1 text-danger hover:bg-danger-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                    >
                      <Trash2 size={12} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div>
          <input
            ref={inputRef}
            id="ticket-screenshot-input"
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => processFiles(e.target.files)}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              processFiles(e.dataTransfer.files);
            }}
            className={`rounded-control border border-dashed p-3.5 text-left transition-colors duration-150 flex flex-wrap items-center justify-between gap-2 ${
              dragActive
                ? "border-accent bg-accent-tint"
                : "border-line-strong bg-well/40 hover:border-ink-muted"
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Upload size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>
                Drop images here or{" "}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="font-medium text-accent hover:text-accent-hover underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-control cursor-pointer"
                >
                  browse files
                </button>
              </span>
            </div>
            <span className="font-mono text-[11px] text-ink-subtle">
              PNG, JPG, WEBP, GIF · max 3 MB
            </span>

            {uploading && (
              <div className="w-full mt-1">
                <div className="flex justify-between font-mono text-[11px] text-ink-muted mb-1">
                  <span>Uploading</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-badge bg-line overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <p role="alert" className="w-full text-xs text-danger">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      )}

      <Modal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.filename || "Screenshot preview"}
        maxWidth="max-w-4xl"
      >
        {previewItem && (
          <div className="flex justify-center bg-well rounded-control border border-line p-2">
            <img
              src={previewItem.fullUrl}
              alt={previewItem.filename}
              className="max-h-[75vh] w-auto object-contain rounded-control"
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeIndex !== null}
        onClose={() => setRemoveIndex(null)}
        onConfirm={handleConfirmRemove}
        loading={removing}
        title="Remove screenshot"
        confirmLabel="Remove"
        message="This removes the screenshot from the ticket. This cannot be undone."
      />
    </section>
  );
}
