export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

export function formatFullDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function suggestProjectKey(title = "") {
  const words = String(title)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const wordLetters = words
    .map((w) => w.replace(/[^A-Z]/g, ""))
    .filter(Boolean);

  let candidate = "";
  if (wordLetters.length >= 2) {
    candidate = wordLetters
      .map((w) => w[0])
      .join("")
      .slice(0, 5);
  } else if (wordLetters.length === 1) {
    candidate = wordLetters[0].slice(0, 4);
  }

  if (candidate.length < 2) {
    const letters = String(title)
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    candidate = (candidate + letters).slice(0, 4);
  }

  return candidate;
}

export function getProjectRouteId(project) {
  return project?.key || project?._id || "";
}

export function getTicketRouteId(ticket) {
  return ticket?.key || ticket?._id || "";
}
