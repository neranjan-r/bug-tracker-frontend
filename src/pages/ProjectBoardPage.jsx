import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, Plus } from "lucide-react";
import api from "../api/client.js";
import { useProjectLiveUpdates } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import TicketFilterBar from "../components/TicketFilterBar.jsx";
import TicketFormModal from "../components/TicketFormModal.jsx";
import { PriorityBadge, TypeBadge, UserAvatar } from "../components/badges.jsx";
import { AlertBanner, Button } from "../components/ui.jsx";
import { getProjectRouteId, getTicketRouteId } from "../utils/format.js";
import usePageTitle from "../utils/usePageTitle.js";
import {
  setPreferredProjectView,
  useTicketShortcuts,
} from "../utils/viewPrefs.js";

const COLUMNS = [
  { id: "todo", title: "TO DO" },
  { id: "in-progress", title: "IN PROGRESS" },
  { id: "done", title: "DONE" },
];

function groupTicketsByStatus(tickets) {
  const grouped = { todo: [], "in-progress": [], done: [] };
  for (const ticket of tickets) {
    if (grouped[ticket.status]) {
      grouped[ticket.status].push(ticket);
    }
  }
  return grouped;
}

function TicketCardContent({ ticket, isGhost = false }) {
  return (
    <div
      className={`rounded-control border bg-surface p-2.5 transition-colors duration-150 ${
        isGhost
          ? "border-accent shadow-card"
          : "border-line hover:border-line-strong"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeBadge type={ticket.type} compact />
          <span className="font-mono text-[11px] font-medium text-ink-muted">
            {ticket.key || ticket._id.slice(-6).toUpperCase()}
          </span>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <h3 className="text-[13px] font-medium text-ink line-clamp-2 leading-snug">
        {ticket.title}
      </h3>

      <div className="mt-2.5 pt-2 border-t border-line/70 flex items-center justify-between text-xs text-ink-muted">
        <span
          className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums"
          title={`${ticket.commentCount || 0} comments`}
        >
          <MessageSquare size={12} strokeWidth={1.75} aria-hidden="true" />
          <span>{ticket.commentCount || 0}</span>
        </span>
        <UserAvatar user={ticket.assignee} size="xs" />
      </div>
    </div>
  );
}

function SortableTicketCard({ ticket, canDrag, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket._id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canDrag ? listeners : {})}
      onClick={() => onOpen(ticket)}
      className={`outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-control ${
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${isDragging ? "opacity-35" : ""}`}
    >
      <TicketCardContent ticket={ticket} />
    </div>
  );
}

function BoardColumn({ column, tickets, canDrag, onOpenTicket }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      className={`flex flex-col rounded-panel border bg-well min-h-[26rem] transition-colors duration-150 ${
        isOver ? "border-accent bg-well-hover" : "border-line"
      }`}
    >
      <header className="px-3 py-2.5 border-b border-line flex items-center gap-2">
        <h2 className="font-mono text-[11px] font-semibold tracking-wider text-ink-muted">
          {column.title}
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-ink-subtle">
          {tickets.length}
        </span>
      </header>

      <div ref={setNodeRef} className="flex-1 p-2 space-y-2">
        <SortableContext
          items={tickets.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.length === 0 ? (
            <div className="h-24 rounded-control border border-dashed border-line flex items-center justify-center text-xs text-ink-subtle">
              No tickets
            </div>
          ) : (
            tickets.map((ticket) => (
              <SortableTicketCard
                key={ticket._id}
                ticket={ticket}
                canDrag={canDrag}
                onOpen={onOpenTicket}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}

export default function ProjectBoardPage() {
  const { project, role, membersList } = useProject();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  usePageTitle(`${project.key || project.title} Board`);

  const projectSlug = getProjectRouteId(project);
  const canCreate = role === "owner" || role === "developer";
  const canDrag = canCreate;

  const searchRef = useRef(null);
  const [columns, setColumns] = useState({
    todo: [],
    "in-progress": [],
    done: [],
  });
  const [totals, setTotals] = useState({ shown: 0, projectTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const snapshotRef = useRef(null);

  useEffect(() => {
    setPreferredProjectView(project, "board");
  }, [project]);

  useTicketShortcuts({
    canCreate,
    onNewTicket: () => setModalOpen(true),
    searchRef,
    modalOpen,
  });

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      priority: searchParams.get("priority") || "",
      type: searchParams.get("type") || "",
      assignee: searchParams.get("assignee") || "",
      sort: searchParams.get("sort") || "",
    }),
    [searchParams]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadBoardTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        if (filters.search) qs.set("search", filters.search);
        if (filters.status) qs.set("status", filters.status);
        if (filters.priority) qs.set("priority", filters.priority);
        if (filters.type) qs.set("type", filters.type);
        if (filters.assignee) qs.set("assignee", filters.assignee);
        qs.set("sort", filters.sort || "order");
        qs.set("limit", "200");

        const data = await api.get(
          `/projects/${project._id}/tickets?${qs.toString()}`
        );
        const list = data.tickets || [];
        setColumns(groupTicketsByStatus(list));
        setTotals({
          shown: data.pagination?.total ?? list.length,
          projectTotal: data.pagination?.projectTotal ?? list.length,
        });
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [project._id, filters]
  );

  useEffect(() => {
    loadBoardTickets();
  }, [loadBoardTickets]);

  useProjectLiveUpdates({
    onEvent: (eventName) => {
      if (eventName.startsWith("ticket:") || eventName.startsWith("comment:")) {
        loadBoardTickets({ silent: true });
      }
    },
    onReconnect: () => loadBoardTickets({ silent: true }),
  });

  const handleFilterChange = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  function findContainer(cols, id) {
    if (id in cols) return id;
    return Object.keys(cols).find((colKey) =>
      cols[colKey].some((item) => item._id === id)
    );
  }

  function handleDragStart(event) {
    if (!canDrag) return;
    setActiveId(event.active.id);
    snapshotRef.current = {
      todo: [...columns.todo],
      "in-progress": [...columns["in-progress"]],
      done: [...columns.done],
    };
  }

  function handleDragOver(event) {
    if (!canDrag) return;
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(columns, active.id);
    const overContainer = findContainer(columns, over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const sourceItems = [...prev[activeContainer]];
      const targetItems = [...prev[overContainer]];
      const activeIndex = sourceItems.findIndex((i) => i._id === active.id);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);
      const updatedItem = { ...movedItem, status: overContainer };

      let overIndex = targetItems.findIndex((i) => i._id === over.id);
      if (overIndex === -1) {
        overIndex = targetItems.length;
      }

      targetItems.splice(overIndex, 0, updatedItem);

      return {
        ...prev,
        [activeContainer]: sourceItems,
        [overContainer]: targetItems,
      };
    });
  }

  async function handleDragEnd(event) {
    if (!canDrag) return;
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      if (snapshotRef.current) setColumns(snapshotRef.current);
      snapshotRef.current = null;
      return;
    }

    const activeContainer = findContainer(columns, active.id);
    const overContainer = findContainer(columns, over.id);

    if (!activeContainer || !overContainer) {
      if (snapshotRef.current) setColumns(snapshotRef.current);
      snapshotRef.current = null;
      return;
    }

    let nextColumns = columns;
    if (activeContainer === overContainer) {
      const items = columns[activeContainer];
      const oldIndex = items.findIndex((i) => i._id === active.id);
      const newIndex = items.findIndex((i) => i._id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        nextColumns = {
          ...columns,
          [activeContainer]: arrayMove(items, oldIndex, newIndex),
        };
        setColumns(nextColumns);
      }
    }

    const finalColumn = overContainer;
    const finalPosition = nextColumns[finalColumn].findIndex(
      (i) => i._id === active.id
    );

    const prevSnapshot = snapshotRef.current;
    snapshotRef.current = null;

    if (finalPosition === -1) return;

    const prevCol = prevSnapshot ? findContainer(prevSnapshot, active.id) : null;
    const prevPos =
      prevCol && prevSnapshot
        ? prevSnapshot[prevCol].findIndex((i) => i._id === active.id)
        : -1;
    if (prevCol === finalColumn && prevPos === finalPosition) {
      return;
    }

    try {
      await api.patch(`/tickets/${active.id}/move`, {
        status: finalColumn,
        position: finalPosition,
      });
    } catch (err) {
      if (prevSnapshot) {
        setColumns(prevSnapshot);
      }
      toast.error(err.message || "Could not move ticket.");
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    if (snapshotRef.current) {
      setColumns(snapshotRef.current);
      snapshotRef.current = null;
    }
  }

  const allTickets = [
    ...columns.todo,
    ...columns["in-progress"],
    ...columns.done,
  ];
  const activeTicket = allTickets.find((t) => t._id === activeId) || null;
  const countSummary = `${totals.shown} of ${totals.projectTotal} tickets`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-xs text-ink-muted">
          {canDrag ? (
            <>
              Drag cards to change status or column order. Press{" "}
              <kbd className="rounded-badge border border-line bg-well px-1 py-0.5 text-[10px] text-ink">
                C
              </kbd>{" "}
              to create a ticket.
            </>
          ) : (
            "Read-only viewer access for this project."
          )}
        </p>

        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <span>Create ticket</span>
          </Button>
        )}
      </div>

      <TicketFilterBar
        filters={filters}
        onChangeFilter={handleFilterChange}
        onClear={handleClearFilters}
        membersList={membersList}
        defaultSortLabel="Board order"
        searchRef={searchRef}
        countSummary={!loading ? countSummary : ""}
      />

      {error && (
        <div className="mb-4">
          <AlertBanner message={error} onRetry={() => loadBoardTickets()} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="rounded-panel border border-line bg-well p-2.5 min-h-[22rem] space-y-2"
            >
              <div className="h-4 w-24 rounded bg-surface" />
              <div className="h-20 rounded-control border border-line bg-surface" />
              <div className="h-20 rounded-control border border-line bg-surface" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {COLUMNS.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                tickets={columns[column.id]}
                canDrag={canDrag}
                onOpenTicket={(t) =>
                  navigate(`/projects/${projectSlug}/tickets/${getTicketRouteId(t)}`)
                }
              />
            ))}
          </div>

          <DragOverlay>
            {activeTicket ? <TicketCardContent ticket={activeTicket} isGhost /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <TicketFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={project._id}
        membersList={membersList}
        onSaved={() => loadBoardTickets({ silent: true })}
      />
    </div>
  );
}
