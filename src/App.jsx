import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AppLayout from "./components/AppLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ProjectLayout from "./pages/ProjectLayout.jsx";
import ProjectOverviewPage from "./pages/ProjectOverviewPage.jsx";
import ProjectBoardPage from "./pages/ProjectBoardPage.jsx";
import ProjectListPage from "./pages/ProjectListPage.jsx";
import ProjectMembersPage from "./pages/ProjectMembersPage.jsx";
import ProjectSettingsPage from "./pages/ProjectSettingsPage.jsx";
import TicketDetailPage from "./pages/TicketDetailPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId" element={<ProjectLayout />}>
                    <Route index element={<ProjectBoardPage />} />
                    <Route path="overview" element={<ProjectOverviewPage />} />
                    <Route path="list" element={<ProjectListPage />} />
                    <Route path="members" element={<ProjectMembersPage />} />
                    <Route path="settings" element={<ProjectSettingsPage />} />
                    <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
