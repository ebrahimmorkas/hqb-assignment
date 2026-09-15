import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
      </AuthProvider>
    </BrowserRouter>
  );
}
