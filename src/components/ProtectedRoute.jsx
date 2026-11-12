import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function SessionLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-start justify-center bg-paper px-6 max-w-md mx-auto gap-2"
      role="status"
      aria-label="Checking session"
    >
      <div className="h-4 w-28 rounded-badge bg-well animate-pulse" />
      <p className="font-mono text-xs text-ink-muted">Checking session...</p>
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoader />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
