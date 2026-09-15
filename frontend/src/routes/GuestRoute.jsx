import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Keeps an already-logged-in user off the login page.
export default function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
