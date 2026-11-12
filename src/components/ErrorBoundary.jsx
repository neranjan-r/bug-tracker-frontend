import { Component } from "react";
import { Button } from "./ui.jsx";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-paper p-6">
          <div className="max-w-md w-full rounded-panel border border-line-strong bg-surface p-6 text-left">
            <p className="font-mono text-xs uppercase tracking-wide text-danger">
              Render error
            </p>
            <h1 className="mt-1 text-lg font-semibold text-ink">
              Could not display this view
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              Reload the page or return to the projects list to continue.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Button variant="quiet" onClick={() => window.location.assign("/")}>
                Projects
              </Button>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
