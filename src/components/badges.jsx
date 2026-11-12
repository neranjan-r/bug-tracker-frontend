const ROLE_STYLES = {
  owner: "bg-indigo-50 text-indigo-700 border-indigo-200",
  developer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  viewer: "bg-slate-100 text-slate-700 border-slate-200",
};

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-sky-50 text-sky-700 border-sky-200",
  high: "bg-amber-50 text-amber-800 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_STYLES = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  "in-progress": "bg-amber-50 text-amber-800 border-amber-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_LABELS = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const TYPE_META = {
  bug: { label: "Bug", icon: "🐞", style: "bg-rose-50 text-rose-700 border-rose-200" },
  feature: {
    label: "Feature",
    icon: "✨",
    style: "bg-purple-50 text-purple-700 border-purple-200",
  },
  task: { label: "Task", icon: "✓", style: "bg-blue-50 text-blue-700 border-blue-200" },
};

export function RoleBadge({ role }) {
  const cls = ROLE_STYLES[role] || ROLE_STYLES.viewer;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {role}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cls = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.todo;
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

export function TypeBadge({ type, compact = false }) {
  const meta = TYPE_META[type] || TYPE_META.task;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.style}`}
      title={meta.label}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {!compact && <span>{meta.label}</span>}
    </span>
  );
}

export function UserAvatar({ user, size = "sm" }) {
  if (!user?.name) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-400 border border-slate-200"
        title="Unassigned"
      >
        —
      </span>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const colors = [
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-violet-600",
  ];
  let hash = 0;
  for (let i = 0; i < user.name.length; i += 1) {
    hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  const dims = size === "md" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]";

  return (
    <span
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-full ${color} font-semibold text-white`}
      title={user.name}
    >
      {initials}
    </span>
  );
}

