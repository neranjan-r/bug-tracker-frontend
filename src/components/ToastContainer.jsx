export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)]"
    >
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
              isError
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-current opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 rounded px-1"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

