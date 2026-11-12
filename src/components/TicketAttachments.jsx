import { useRef, useState } from "react";
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
      const msg = "You can upload a maximum of 5 screenshots at a time.";
      setUploadError(msg);
      toast.error(msg);
      return;
    }

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        const msg = `"${file.name}" is not a supported image (png, jpg, jpeg, webp, gif).`;
        setUploadError(msg);
        toast.error(msg);
        return;
      }
      if (file.size > MAX_BYTES) {
        const msg = `"${file.name}" exceeds the 3 MB size limit.`;
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
      toast.success(
        files.length === 1 ? "Screenshot uploaded." : "Screenshots uploaded."
      );
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
      toast.success("Screenshot removed.");
      setRemoveIndex(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  }

  const attachments = ticket.attachments || [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Screenshots ({attachments.length})
        </h2>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-slate-500">No screenshots attached yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {attachments.map((att, index) => {
            const fullUrl = getAssetUrl(att.url);
            return (
              <div
                key={`${att.url}-${index}`}
                className="group relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setPreviewItem({ ...att, fullUrl })}
                  className="block w-full aspect-video overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label={`View ${att.filename}`}
                >
                  <img
                    src={fullUrl}
                    alt={att.filename}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
                <div className="px-2 py-1.5 flex items-center justify-between gap-1 bg-white border-t border-slate-200">
                  <span
                    className="text-xs text-slate-600 truncate"
                    title={att.filename}
                  >
                    {att.filename}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setRemoveIndex(index)}
                      aria-label={`Remove ${att.filename}`}
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Remove
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
            className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
              dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 bg-slate-50/60 hover:border-indigo-400"
            }`}
          >
            <p className="text-sm font-medium text-slate-700">
              Drag and drop screenshots here, or{" "}
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-indigo-600 hover:text-indigo-500 underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                browse files
              </button>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PNG, JPG, WEBP or GIF up to 3 MB each (max 5 per upload)
            </p>

            {uploading && (
              <div className="mt-3 max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      )}

      <Modal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.filename || "Screenshot Preview"}
        maxWidth="max-w-4xl"
      >
        {previewItem && (
          <div className="flex justify-center bg-slate-950/5 rounded-lg p-2">
            <img
              src={previewItem.fullUrl}
              alt={previewItem.filename}
              className="max-h-[75vh] w-auto object-contain rounded"
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeIndex !== null}
        onClose={() => setRemoveIndex(null)}
        onConfirm={handleConfirmRemove}
        loading={removing}
        title="Remove Screenshot"
        confirmLabel="Remove"
        message="Remove this screenshot from the ticket?"
      />
    </section>
  );
}

