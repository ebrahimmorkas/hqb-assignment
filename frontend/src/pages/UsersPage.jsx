import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as userApi from '../api/userApi';
import * as watanApi from '../api/watanApi';
import { ROLES } from '../constants/roles';
import { STATUS } from '../constants/status';
import DataTable from '../components/table/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import UserForm from '../components/users/UserForm';
import Navbar from '../components/layout/Navbar';
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
    <Badge tone={row.status === STATUS.ACTIVE ? 'primary' : 'gray'}>
      {row.status === STATUS.ACTIVE ? 'Active' : 'Inactive'}
    </Badge>
  ),
};

// What each actor role may edit on someone else's row - mirrors the
// backend's editableFieldsFor() exactly, so the fields shown here are
// always a subset of what the server will actually accept.
const EDIT_FIELDS = {
  [ROLES.ADMIN]: ['name', 'email', 'phone', 'age'],
  [ROLES.SUPER_ADMIN]: ['name', 'email', 'phone', 'age', 'its', 'watan'],
};

const CREATE_FIELDS = ['name', 'email', 'phone', 'its', 'age', 'watan', 'role', 'password'];

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watanOptions, setWatanOptions] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    // Only super-admin ever sees a watan field (edit or create) - no need
    // for admin to fetch this list at all.
    if (user?.role === ROLES.SUPER_ADMIN) {
      watanApi.getAllWatans().then(setWatanOptions).catch(() => setWatanOptions([]));
    }
  }, [user?.role]);

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

  const handleMarkInactive = (row) =>
    runAction('Mark inactive', `Mark ${row.name} inactive?`, () => userApi.markUserInactive(row._id));

  const handleMarkActive = (row) =>
    runAction('Mark active', `Mark ${row.name} active?`, () => userApi.markUserActive(row._id));

  const handleDelete = (row) =>
    runAction('Delete', `Delete ${row.name}? This cannot be undone from this screen.`, () =>
      userApi.deleteUser(row._id)
    );

  const handleEditSubmit = async (data) => {
    await userApi.updateUser(editingUser._id, data);
    setEditingUser(null);
    await loadUsers();
  };

  const handleCreateSubmit = async (data) => {
    await userApi.createUser(data);
    setCreating(false);
    await loadUsers();
  };

  // Exactly the two rules given: admin gets Edit + Mark Inactive, but only
  // while the row is Active (nothing once it's Inactive - only a
  // super-admin can act on it from there). Super-admin gets Edit while
  // Active, or Mark Active + Delete while Inactive - never Edit alongside
  // those two.
  const getRowActions = (row) => {
    if (user.role === ROLES.ADMIN) {
      if (row.status !== STATUS.ACTIVE) return [];
      return [
        { key: 'edit', label: 'Edit', icon: EditIcon, onClick: setEditingUser },
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
      return [{ key: 'edit', label: 'Edit', icon: EditIcon, onClick: setEditingUser }];
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
    <div className="min-h-screen bg-background">
      <Navbar>
        {user?.role === ROLES.SUPER_ADMIN && (
          <Button className="w-auto" onClick={() => setCreating(true)}>
            Create User
          </Button>
        )}
      </Navbar>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-text">Users</h1>

        <Alert>{error}</Alert>

        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : (
          <DataTable columns={columns} data={users} rowKey="_id" actions={getRowActions} />
        )}
      </div>

      {editingUser && (
        <Modal title={`Edit ${editingUser.name}`} onClose={() => setEditingUser(null)}>
          <UserForm
            fields={EDIT_FIELDS[user.role]}
            initialValues={editingUser}
            watanOptions={watanOptions}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingUser(null)}
            submitLabel="Save changes"
          />
        </Modal>
      )}

      {creating && (
        <Modal title="Create User" onClose={() => setCreating(false)}>
          <UserForm
            fields={CREATE_FIELDS}
            watanOptions={watanOptions}
            onSubmit={handleCreateSubmit}
            onCancel={() => setCreating(false)}
            submitLabel="Create"
          />
        </Modal>
      )}
    </div>
  );
}
