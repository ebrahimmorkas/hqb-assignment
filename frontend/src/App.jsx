import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { setNavigator } from './utils/navigation';
import { ROLES } from './constants/roles';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';
import RoleRoute from './routes/RoleRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import EditProfilePage from './pages/EditProfilePage';
import FindUserActionPage from './pages/FindUserActionPage';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import ServerError from './pages/ServerError';

// Registers react-router's navigate() with utils/navigation so non-component
// code (api/client.js, reacting to a 403/500 response) can redirect too.
function NavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <NavigationBridge />
      <AuthProvider>
        {/* Above <Routes> so sidebar open/closed state survives navigation
            instead of resetting on every page remount. */}
        <SidebarProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={[ROLES.SUPER_ADMIN]}>
                    <CreateUserPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                    <EditUserPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            {/* Sidebar "find by ITS" flow - one page (FindUserActionPage),
                gated per action to match the backend's exact permissions:
                Update is shared, the status actions are role-specific.
                key={action} forces a full remount when navigating between
                these 4 routes - without it, React reuses the same component
                instance (same type at the same tree position) and its old
                search/error/found-user state leaks into the "new" page. */}
            <Route
              path="/users/find/update"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
                    <FindUserActionPage key="update" action="update" />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/find/mark-active"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={[ROLES.SUPER_ADMIN]}>
                    <FindUserActionPage key="mark-active" action="mark-active" />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/find/delete"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={[ROLES.SUPER_ADMIN]}>
                    <FindUserActionPage key="delete" action="delete" />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/find/mark-inactive"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={[ROLES.ADMIN]}>
                    <FindUserActionPage key="mark-inactive" action="mark-inactive" />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="/error" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
