import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as userApi from '../api/userApi';
import { ROLES } from '../constants/roles';
import { STATUS } from '../constants/status';
import DataTable from '../components/table/DataTable';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import AdminLayout from '../components/layout/AdminLayout';
import { EditIcon, PauseCircleIcon, PlayCircleIcon, TrashIcon } from '../components/ui/icons';

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
    <Badge tone={row.status === STATUS.ACTIVE ? 'success' : 'gray'}>
      {row.status === STATUS.ACTIVE ? 'Active' : 'Inactive'}
    </Badge>
  ),
};

export default function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const runAction = async (label, confirmMessage, successMessage, action) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setError('');
    setSuccess('');
    try {
      await action();
      await loadUsers();
      setSuccess(successMessage);
    } catch (err) {
      setError(err.message || `${label} failed`);
    }
  };

  const handleMarkInactive = (row) =>
    runAction(
      'Mark inactive',
      `Mark ${row.name} inactive?`,
      `${row.name} marked inactive.`,
      () => userApi.markUserInactive(row._id)
    );

  const handleMarkActive = (row) =>
    runAction(
      'Mark active',
      `Mark ${row.name} active?`,
      `${row.name} marked active.`,
      () => userApi.markUserActive(row._id)
    );

  const handleDelete = (row) =>
    runAction(
      'Delete',
      `Delete ${row.name}? This cannot be undone from this screen.`,
      `${row.name} deleted.`,
      () => userApi.deleteUser(row._id)
    );

  const goToEdit = (row) => navigate(`/users/${row._id}/edit`);

  // Admin: Edit + Mark Inactive, but only while the row is Active - nothing
  // once it's Inactive (only a super-admin can act on it from there).
  //
  // Super-admin: Edit while Active - PLUS Mark Inactive, but only for a
  // role: admin row, since a regular admin can never manage another admin's
  // row at all, so super-admin is the only one who can ever deactivate one
  // (the bypass). While Inactive: Mark Active + Delete, never Edit alongside
  // those two.
  const getRowActions = (row) => {
    if (user.role === ROLES.ADMIN) {
      if (row.status !== STATUS.ACTIVE) return [];
      return [
        { key: 'edit', label: 'Edit', icon: EditIcon, onClick: goToEdit },
        {
          key: 'mark-inactive',
          label: 'Mark Inactive',
          icon: PauseCircleIcon,
          onClick: handleMarkInactive,
        },
      ];
    }

    // super-admin
    if (row.status === STATUS.ACTIVE) {
      const actions = [{ key: 'edit', label: 'Edit', icon: EditIcon, onClick: goToEdit }];
      if (row.role === ROLES.ADMIN) {
        actions.push({
          key: 'mark-inactive',
          label: 'Mark Inactive',
          icon: PauseCircleIcon,
          onClick: handleMarkInactive,
        });
      }
      return actions;
    }
    return [
      {
        key: 'mark-active',
        label: 'Mark Active',
        icon: PlayCircleIcon,
        onClick: handleMarkActive,
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: TrashIcon,
        onClick: handleDelete,
        variant: 'danger',
      },
    ];
  };

  // Admin's table only ever contains role: user rows (see canManage on the
  // backend), so a Role column there would just repeat "user" every row -
  // only super-admin's table (users + admins) needs it to tell rows apart.
  const columns =
    user?.role === ROLES.SUPER_ADMIN
      ? [...baseColumns, watanColumn, roleColumn, statusColumn]
      : [...baseColumns, statusColumn];

  return (
    <AdminLayout title="Users">
      <Alert tone="danger" onClose={() => setError('')}>
        {error}
      </Alert>
      <Alert tone="success" onClose={() => setSuccess('')}>
        {success}
      </Alert>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <DataTable columns={columns} data={users} rowKey="_id" actions={getRowActions} />
      )}
    </AdminLayout>
  );
}
