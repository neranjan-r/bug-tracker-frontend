import { X } from "lucide-react";

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-3 right-3 z-50 flex flex-col gap-1.5 max-w-xs w-[calc(100%-1.5rem)]"
    >
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-control border text-xs font-medium transition-opacity duration-150 ${
              isError
                ? "bg-danger-tint border-danger-border text-danger"
                : "bg-ink border-ink text-paper"
            }`}
          >
            <span className="leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-control p-0.5 cursor-pointer"
            >
              <X size={13} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
