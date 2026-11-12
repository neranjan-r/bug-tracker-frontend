import Modal from "./Modal.jsx";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm action",
  message,
  confirmLabel = "Delete",
  loading = false,
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
            danger
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          }`}
        >
          {loading ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

