import { useEffect } from "react";

const VIEW_PREFIX = "tracebook:project-view:";

export function getPreferredProjectView(projectIdOrKey) {
  if (!projectIdOrKey) return "board";
  try {
    const saved = localStorage.getItem(`${VIEW_PREFIX}${projectIdOrKey}`);
    return saved === "list" ? "list" : "board";
  } catch {
    return "board";
  }
}

export function setPreferredProjectView(project, view) {
  if (!project || (view !== "board" && view !== "list")) return;
  try {
    if (project._id) localStorage.setItem(`${VIEW_PREFIX}${project._id}`, view);
    if (project.key) localStorage.setItem(`${VIEW_PREFIX}${project.key}`, view);
  } catch {
    // Ignore storage quota errors in restricted browsers
  }
}

function isEditableElement(target) {
  if (!target) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Bind C (new ticket) and / (focus search) keyboard shortcuts on project work views.
 */
export function useTicketShortcuts({
  canCreate = false,
  onNewTicket,
  searchRef,
  modalOpen = false,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape" && document.activeElement === searchRef?.current) {
        searchRef.current.blur();
        return;
      }

      if (modalOpen || isEditableElement(e.target)) return;

      if (e.key === "/") {
        if (searchRef?.current) {
          e.preventDefault();
          searchRef.current.focus();
          searchRef.current.select();
        }
      } else if ((e.key === "c" || e.key === "C") && canCreate && onNewTicket) {
        e.preventDefault();
        onNewTicket();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canCreate, onNewTicket, searchRef, modalOpen]);
}
