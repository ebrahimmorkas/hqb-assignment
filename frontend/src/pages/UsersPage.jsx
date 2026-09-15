import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as userApi from '../api/userApi';
import { ROLES } from '../constants/roles';
import { STATUS } from '../constants/status';
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

const statusColumn = {
  key: 'status',
  header: 'Status',
  render: (row) => (
    <Badge tone={row.status === STATUS.ACTIVE ? 'primary' : 'gray'}>
      {row.status === STATUS.ACTIVE ? 'Active' : 'Inactive'}
    </Badge>
  ),
};

export default function UsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(() => {
    setLoading(true);
    return userApi
      .getAllUsers()
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const runAction = async (label, confirmMessage, action) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setError('');
    try {
      await action();
      await loadUsers();
    } catch (err) {
      setError(err.message || `${label} failed`);
    }
  };

  const handleEdit = (row) => {
    // Edit form isn't built yet - the button is wired to reach this point,
    // and only shows for rows the visibility rule below permits.
    console.log('Edit requested for', row._id);
  };

  const handleMarkInactive = (row) =>
    runAction('Mark inactive', `Mark ${row.name} inactive?`, () => userApi.markUserInactive(row._id));

  const handleMarkActive = (row) =>
    runAction('Mark active', `Mark ${row.name} active?`, () => userApi.markUserActive(row._id));

  const handleDelete = (row) =>
    runAction('Delete', `Delete ${row.name}? This cannot be undone from this screen.`, () =>
      userApi.deleteUser(row._id)
    );

  // Exactly the two rules given: admin gets Edit + Mark Inactive, but only
  // while the row is Active (nothing once it's Inactive - only a
  // super-admin can act on it from there). Super-admin gets Edit while
  // Active, or Mark Active + Delete while Inactive - never Edit alongside
  // those two.
  const getRowActions = (row) => {
    if (user.role === ROLES.ADMIN) {
      if (row.status !== STATUS.ACTIVE) return [];
      return [
        { key: 'edit', label: 'Edit', onClick: handleEdit },
        { key: 'mark-inactive', label: 'Mark Inactive', onClick: handleMarkInactive },
      ];
    }

    // super-admin
    if (row.status === STATUS.ACTIVE) {
      return [{ key: 'edit', label: 'Edit', onClick: handleEdit }];
    }
    return [
      { key: 'mark-active', label: 'Mark Active', onClick: handleMarkActive },
      { key: 'delete', label: 'Delete', onClick: handleDelete, variant: 'danger' },
    ];
  };

  const columns =
    user?.role === ROLES.SUPER_ADMIN
      ? [...baseColumns, watanColumn, roleColumn, statusColumn]
      : [...baseColumns, roleColumn, statusColumn];

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
          <DataTable columns={columns} data={users} rowKey="_id" actions={getRowActions} />
        )}
      </div>
    </div>
  );
}
