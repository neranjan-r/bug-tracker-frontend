import Modal from "./Modal.jsx";
import { Button } from "./ui.jsx";

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
      <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
      <div className="mt-5 flex items-center justify-end gap-2">
        <Button variant="quiet" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Working..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
