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
import api from "../api/client.js";
import { useProjectLiveUpdates } from "../context/SocketContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useProject } from "./ProjectLayout.jsx";
import TicketFilterBar from "../components/TicketFilterBar.jsx";
import TicketFormModal from "../components/TicketFormModal.jsx";
import { PriorityBadge, TypeBadge, UserAvatar } from "../components/badges.jsx";
import usePageTitle from "../utils/usePageTitle.js";

const COLUMNS = [
  { id: "todo", title: "To Do", accent: "bg-slate-400" },
  { id: "in-progress", title: "In Progress", accent: "bg-amber-500" },
  { id: "done", title: "Done", accent: "bg-emerald-500" },
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
      className={`rounded-lg border bg-white p-3.5 transition-shadow ${
        isGhost
          ? "border-indigo-400 shadow-xl ring-2 ring-indigo-500/30 rotate-1"
          : "border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <TypeBadge type={ticket.type} compact />
        <PriorityBadge priority={ticket.priority} />
      </div>

      <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
        {ticket.title}
      </h3>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span
          className="inline-flex items-center gap-1"
          title={`${ticket.commentCount || 0} comments`}
        >
          <span aria-hidden="true">💬</span>
          <span>{ticket.commentCount || 0}</span>
        </span>
        <UserAvatar user={ticket.assignee} />
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
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      onClick={() => {
        if (!isDragging) onOpen(ticket._id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onOpen(ticket._id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ticket ${ticket.title}`}
      className={`rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${isDragging ? "opacity-35 ring-2 ring-dashed ring-indigo-400" : ""}`}
    >
      <TicketCardContent ticket={ticket} />
    </div>
  );
}

function KanbanColumn({ column, items, canDrag, onOpenTicket }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <section
      aria-label={column.title}
      className={`flex flex-col rounded-xl border p-3 min-w-[285px] w-80 lg:w-auto lg:flex-1 shrink-0 transition-colors ${
        isOver
          ? "border-indigo-400 bg-indigo-50/50"
          : "border-slate-200 bg-slate-100/70"
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${column.accent}`} />
          <h3 className="text-sm font-semibold text-slate-800">{column.title}</h3>
        </div>
        <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {items.length}
        </span>
      </div>

      <SortableContext
        items={items.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="flex-1 space-y-2.5 min-h-[140px]"
        >
          {items.length === 0 ? (
            <div
              className={`h-24 rounded-lg border border-dashed flex items-center justify-center text-xs ${
                isOver
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium"
                  : "border-slate-300 text-slate-400"
              }`}
            >
              {isOver ? "Drop ticket here" : "No tickets"}
            </div>
          ) : (
            items.map((ticket) => (
              <SortableTicketCard
                key={ticket._id}
                ticket={ticket}
                canDrag={canDrag}
                onOpen={onOpenTicket}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export default function ProjectBoardPage() {
  const { project, role, membersList } = useProject();
  usePageTitle(`${project.title} · Board`);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const canDrag = role === "owner" || role === "developer";

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

  const [columns, setColumns] = useState({
    todo: [],
    "in-progress": [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [activeId, setActiveId] = useState(null);
  const snapshotRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
        setColumns(groupTicketsByStatus(data.tickets || []));
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

    // Skip server call if nothing actually moved
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

  const activeTicket = activeId
    ? [...columns.todo, ...columns["in-progress"], ...columns.done].find(
        (t) => t._id === activeId
      )
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Kanban Board</h2>
          {!canDrag && (
            <p className="text-xs text-slate-500">
              Viewer mode: drag and drop is disabled.
            </p>
          )}
        </div>

        {canDrag && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            + New Ticket
          </button>
        )}
      </div>

      <TicketFilterBar
        filters={filters}
        onChangeFilter={handleFilterChange}
        onClear={handleClearFilters}
        membersList={membersList}
        defaultSortLabel="Board Order"
      />

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="min-w-[285px] w-80 lg:w-auto lg:flex-1 rounded-xl border border-slate-200 bg-slate-100/70 p-3 space-y-2.5 animate-pulse"
            >
              <div className="h-5 w-28 rounded bg-slate-200 mb-3" />
              <div className="h-24 rounded-lg bg-white" />
              <div className="h-24 rounded-lg bg-white" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            type="button"
            onClick={loadBoardTickets}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <DndContext
          sensors={canDrag ? sensors : []}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                items={columns[column.id]}
                canDrag={canDrag}
                onOpenTicket={(ticketId) =>
                  navigate(`/projects/${project._id}/tickets/${ticketId}`)
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projectId={project._id}
        membersList={membersList}
        onSaved={() => loadBoardTickets()}
      />
    </div>
  );
}
