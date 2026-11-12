import { useEffect, useState } from "react";

export default function TicketFilterBar({
  filters,
  onChangeFilter,
  onClear,
  membersList = [],
  showSort = true,
  defaultSortLabel = "Newest",
}) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Keep input synced when filters are cleared or URL changes externally
  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  // Debounce search text (~400ms) before notifying parent / updating URL query string
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === (filters.search || "")) return;

    const timer = setTimeout(() => {
      onChangeFilter("search", trimmed);
    }, 400);

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
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm mb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="ticket-search" className="sr-only">
            Search tickets
          </label>
          <input
            id="ticket-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title or description..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label htmlFor="filter-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="filter-status"
            value={filters.status || ""}
            onChange={(e) => onChangeFilter("status", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-priority" className="sr-only">
            Filter by priority
          </label>
          <select
            id="filter-priority"
            value={filters.priority || ""}
            onChange={(e) => onChangeFilter("priority", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-type" className="sr-only">
            Filter by type
          </label>
          <select
            id="filter-type"
            value={filters.type || ""}
            onChange={(e) => onChangeFilter("type", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="task">Task</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-assignee" className="sr-only">
            Filter by assignee
          </label>
          <select
            id="filter-assignee"
            value={filters.assignee || ""}
            onChange={(e) => onChangeFilter("assignee", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
            {membersList.map(
              (entry) =>
                entry.user && (
                  <option key={entry.user._id} value={entry.user._id}>
                    {entry.user.name}
                  </option>
                )
            )}
          </select>
        </div>
      </div>

      {(showSort || hasActiveFilters) && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {showSort ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-sort"
                className="text-xs font-medium text-slate-500"
              >
                Sort by:
              </label>
              <select
                id="filter-sort"
                value={filters.sort || ""}
                onChange={(e) => onChangeFilter("sort", e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">{defaultSortLabel}</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="priority">Highest priority</option>
              </select>
            </div>
          ) : (
            <div />
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

