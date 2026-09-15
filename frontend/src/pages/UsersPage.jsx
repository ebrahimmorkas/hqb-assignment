import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../api/userApi';
import { ROLES } from '../constants/roles';
import DataTable from '../components/table/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const baseColumns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
  { key: 'its', header: 'ITS' },
  { key: 'age', header: 'Age' },
];

const watanColumn = { key: 'watan', header: 'Watan' };

const roleColumn = {
  key: 'role',
  header: 'Role',
  render: (row) => <Badge tone={row.role === ROLES.USER ? 'gray' : 'primary'}>{row.role}</Badge>,
};

export default function UsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllUsers()
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  // Watan only exists in the payload for super-admin (the backend strips it
  // for admin) - the column is only added to match, not what decides it.
  const columns =
    user?.role === ROLES.SUPER_ADMIN
      ? [...baseColumns, watanColumn, roleColumn]
      : [...baseColumns, roleColumn];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text">Users</h1>
          <Button variant="ghost" className="w-auto" onClick={logout}>
            Log out
          </Button>
        </div>

        <Alert>{error}</Alert>

        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : (
          <DataTable columns={columns} data={users} rowKey="_id" actions={[]} />
        )}
      </div>
    </div>
  );
}
