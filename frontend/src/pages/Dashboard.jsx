import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-text">Welcome, {user?.name}</h1>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">ITS</dt>
            <dd className="text-text">{user?.its}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Email</dt>
            <dd className="text-text">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Role</dt>
            <dd className="text-text capitalize">{user?.role}</dd>
          </div>
        </dl>
        <Button variant="ghost" className="mt-6" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
