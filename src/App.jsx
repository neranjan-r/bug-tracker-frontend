import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ProjectLayout from "./pages/ProjectLayout.jsx";
import ProjectOverviewPage from "./pages/ProjectOverviewPage.jsx";
import ProjectBoardPage from "./pages/ProjectBoardPage.jsx";
import ProjectListPage from "./pages/ProjectListPage.jsx";
import TicketDetailPage from "./pages/TicketDetailPage.jsx";
import ProjectMembersPage from "./pages/ProjectMembersPage.jsx";
import ProjectSettingsPage from "./pages/ProjectSettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { getPreferredProjectView } from "./utils/viewPrefs.js";

function ProjectDefaultRedirect() {
  const { projectId } = useParams();
  const view = getPreferredProjectView(projectId);
  return <Navigate to={view} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectLayout />}>
              <Route index element={<ProjectDefaultRedirect />} />
              <Route path="board" element={<ProjectBoardPage />} />
              <Route path="list" element={<ProjectListPage />} />
              <Route path="overview" element={<ProjectOverviewPage />} />
              <Route path="members" element={<ProjectMembersPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
              <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </ErrorBoundary>
  );
}
