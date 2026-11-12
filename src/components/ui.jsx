import { formatFullDate, formatRelativeTime } from "../utils/format.js";

const BUTTON_VARIANTS = {
  primary:
    "bg-accent text-white border border-accent hover:bg-accent-hover hover:border-accent-hover",
  quiet:
    "bg-surface text-ink border border-line-strong hover:bg-well",
  text:
    "bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-well",
  danger:
    "bg-danger text-white border border-danger hover:opacity-90",
  "danger-quiet":
    "bg-danger-tint text-danger border border-danger-border hover:bg-danger hover:text-white",
};

const BUTTON_SIZES = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
};

export function Button({
  variant = "quiet",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-control font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-paper disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.quiet
      } ${BUTTON_SIZES[size] || BUTTON_SIZES.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const INPUT_CLASS =
  "w-full rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-subtle transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-well disabled:opacity-60";

export function FieldLabel({ htmlFor, children, className = "" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-medium text-ink-muted mb-1 ${className}`}
    >
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={`${INPUT_CLASS} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${INPUT_CLASS} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${INPUT_CLASS} ${className}`} {...props} />;
}

export function AlertBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-panel border border-danger-border bg-danger-tint px-3.5 py-2.5 text-sm text-danger flex flex-wrap items-center justify-between gap-3"
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="danger-quiet" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ message, action }) {
  return (
    <div className="rounded-panel border border-dashed border-line-strong bg-surface px-4 py-8 text-left">
      <p className="text-sm text-ink-muted">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function RelativeTime({ date, className = "" }) {
  if (!date) return null;
  const iso = new Date(date).toISOString();
  return (
    <time
      dateTime={iso}
      title={formatFullDate(date)}
      className={`font-mono text-xs text-ink-muted whitespace-nowrap ${className}`}
    >
      {formatRelativeTime(date)}
    </time>
  );
}

export function Wordmark({ compact = false }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        width="18"
        height="18"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="2" y="2" width="28" height="28" rx="4" fill="#1A1916" />
        <path
          d="M9 10.5h14M16 10.5V23"
          stroke="#F7F5F0"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
        <rect x="20" y="18" width="4" height="4" rx="1" fill="#C94A1E" />
      </svg>
      {!compact && (
        <span className="text-sm font-semibold tracking-tight text-ink">
          Tracebook
        </span>
      )}
    </span>
  );
}
