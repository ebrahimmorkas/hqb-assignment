import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Use inside ProtectedRoute - assumes auth/loading is already handled by
// the parent, this only adds the role check on top.
export default function RoleRoute({ allow, children }) {
  const { user } = useAuth();

  if (!allow.includes(user?.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
