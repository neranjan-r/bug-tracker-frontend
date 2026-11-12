import { Bug, CheckSquare, PlusCircle } from "lucide-react";

const ROLE_LABELS = {
  owner: "OWNER",
  developer: "DEV",
  viewer: "VIEWER",
};

const PRIORITY_STYLES = {
  critical: {
    label: "Critical",
    dot: "bg-accent border border-accent",
    text: "text-ink font-medium",
  },
  high: {
    label: "High",
    dot: "bg-warn border border-warn",
    text: "text-ink",
  },
  medium: {
    label: "Medium",
    dot: "bg-ink-muted border border-ink-muted",
    text: "text-ink-muted",
  },
  low: {
    label: "Low",
    dot: "bg-transparent border border-ink-subtle",
    text: "text-ink-muted",
  },
};

const STATUS_STYLES = {
  todo: {
    label: "To Do",
    dot: "bg-transparent border border-ink-muted",
    text: "text-ink-muted",
  },
  "in-progress": {
    label: "In Progress",
    dot: "bg-accent border border-accent",
    text: "text-ink font-medium",
  },
  done: {
    label: "Done",
    dot: "bg-ok border border-ok",
    text: "text-ink-muted",
  },
};

const TYPE_STYLES = {
  bug: { label: "Bug", Icon: Bug, tone: "text-accent" },
  feature: { label: "Feature", Icon: PlusCircle, tone: "text-ink-muted" },
  task: { label: "Task", Icon: CheckSquare, tone: "text-ink-muted" },
};

// Muted earth/ink tones aligned with warm paper UI (no bright rainbow hues)
const AVATAR_PALETTE = [
  "bg-[#2D3A3A] text-[#F7F5F0]",
  "bg-[#5C4D3C] text-[#F7F5F0]",
  "bg-[#3B4252] text-[#F7F5F0]",
  "bg-[#6B3E2E] text-[#F7F5F0]",
  "bg-[#4A5240] text-[#F7F5F0]",
  "bg-[#1A1916] text-[#F7F5F0]",
];

export function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickAvatarColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center rounded-badge border border-line bg-well px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
      {ROLE_LABELS[role] || "VIEWER"}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const item = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${item.text}`}>
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${item.dot}`}
        aria-hidden="true"
      />
      <span>{item.label}</span>
    </span>
  );
}

export function StatusBadge({ status }) {
  const item = STATUS_STYLES[status] || STATUS_STYLES.todo;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${item.text}`}>
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${item.dot}`}
        aria-hidden="true"
      />
      <span>{item.label}</span>
    </span>
  );
}

export function TypeBadge({ type, compact = false }) {
  const item = TYPE_STYLES[type] || TYPE_STYLES.bug;
  const Icon = item.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-ink-muted"
      title={item.label}
    >
      <Icon size={13} strokeWidth={1.75} className={item.tone} aria-hidden="true" />
      {!compact && <span>{item.label}</span>}
    </span>
  );
}

export function UserAvatar({ user, size = "sm", stacked = false }) {
  const dims =
    size === "md"
      ? "h-7 w-7 text-[11px]"
      : size === "xs"
        ? "h-5 w-5 text-[10px]"
        : "h-6 w-6 text-[10px]";

  const ringClass = stacked ? "ring-1 ring-surface" : "";

  if (!user) {
    return (
      <span
        title="Unassigned"
        className={`inline-flex items-center justify-center rounded-badge border border-line bg-well font-mono font-medium text-ink-subtle shrink-0 ${dims} ${ringClass}`}
      >
        --
      </span>
    );
  }

  const color = pickAvatarColor(user._id || user.email || user.name || "");
  return (
    <span
      title={user.name || user.email}
      className={`inline-flex items-center justify-center rounded-badge font-mono font-medium shrink-0 ${color} ${dims} ${ringClass}`}
    >
      {getInitials(user.name)}
    </span>
  );
}

export function AvatarStack({ users = [], max = 4 }) {
  const valid = users.filter(Boolean);
  const shown = valid.slice(0, max);
  const extra = valid.length - shown.length;

  return (
    <div className="inline-flex items-center -space-x-1">
      {shown.map((u) => (
        <UserAvatar key={u._id || u.email} user={u} size="xs" stacked />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-badge border border-line bg-well px-1 font-mono text-[10px] font-medium text-ink-muted ring-1 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  );
}
