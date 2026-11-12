import { Link } from "react-router-dom";
import usePageTitle from "../utils/usePageTitle.js";

export default function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <main className="min-h-[70vh] flex items-center justify-start px-4 py-8">
      <div className="max-w-md w-full rounded-panel border border-line bg-surface p-6 text-left">
        <p className="font-mono text-xs font-medium text-accent">404</p>
        <h1 className="mt-1 text-lg font-semibold text-ink">Page not found</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          No page matches this address. Check the URL or open a project from the list.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center rounded-control bg-accent px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Back to projects
        </Link>
      </div>
    </main>
  );
}
