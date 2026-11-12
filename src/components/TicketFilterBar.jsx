import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button, INPUT_CLASS, Select } from "./ui.jsx";

export default function TicketFilterBar({
  filters,
  onChangeFilter,
  onClear,
  membersList = [],
  showSort = true,
  defaultSortLabel = "Newest",
  searchRef,
  countSummary = "",
}) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === (filters.search || "")) return undefined;

    const timer = setTimeout(() => {
      onChangeFilter("search", trimmed);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onChangeFilter]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.priority ||
      filters.type ||
      filters.assignee ||
      filters.sort
  );

  return (
    <div className="rounded-panel border border-line bg-surface p-2.5 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        <div className="sm:col-span-2 lg:col-span-2 relative">
          <label htmlFor="ticket-search" className="sr-only">
            Search tickets
          </label>
          <Search
            size={14}
            strokeWidth={1.75}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle"
          />
          <input
            ref={searchRef}
            id="ticket-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search key, title, or notes"
            className={`${INPUT_CLASS} pl-8 pr-8`}
          />
          {!searchInput && (
            <kbd
              title="Press / to search"
              className="pointer-events-none hidden sm:inline-flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 rounded-badge border border-line bg-well px-1.5 py-0.5 text-[10px] font-medium text-ink-muted"
            >
              /
            </kbd>
          )}
        </div>

        <div>
          <label htmlFor="filter-status" className="sr-only">
            Filter by status
          </label>
          <Select
            id="filter-status"
            value={filters.status || ""}
            onChange={(e) => onChangeFilter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </Select>
        </div>

        <div>
          <label htmlFor="filter-priority" className="sr-only">
            Filter by priority
          </label>
          <Select
            id="filter-priority"
            value={filters.priority || ""}
            onChange={(e) => onChangeFilter("priority", e.target.value)}
          >
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>

        <div>
          <label htmlFor="filter-type" className="sr-only">
            Filter by type
          </label>
          <Select
            id="filter-type"
            value={filters.type || ""}
            onChange={(e) => onChangeFilter("type", e.target.value)}
          >
            <option value="">All types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="task">Task</option>
          </Select>
        </div>

        <div>
          <label htmlFor="filter-assignee" className="sr-only">
            Filter by assignee
          </label>
          <Select
            id="filter-assignee"
            value={filters.assignee || ""}
            onChange={(e) => onChangeFilter("assignee", e.target.value)}
          >
            <option value="">All assignees</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
            {membersList.map(
              (entry) =>
                entry.user && (
                  <option key={entry.user._id} value={entry.user._id}>
                    {entry.user.name}
                  </option>
                )
            )}
          </Select>
        </div>
      </div>

      {(showSort || hasActiveFilters || countSummary) && (
        <div className="mt-2 pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {showSort && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="filter-sort"
                  className="font-mono text-[11px] uppercase tracking-wide text-ink-muted"
                >
                  Sort
                </label>
                <select
                  id="filter-sort"
                  value={filters.sort || ""}
                  onChange={(e) => onChangeFilter("sort", e.target.value)}
                  className="rounded-control border border-line-strong bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">{defaultSortLabel}</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="priority">Highest priority</option>
                  <option value="key">Key (ascending)</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            )}

            {countSummary && (
              <span className="font-mono text-xs text-ink-muted">
                {countSummary}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button variant="text" size="sm" onClick={onClear}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
