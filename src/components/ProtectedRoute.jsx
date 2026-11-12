import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function FullPageSpinner() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3"
      role="status"
      aria-label="Loading application"
    >
      <div className="h-9 w-9 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      <p className="text-sm text-slate-600 font-medium">Loading...</p>
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

