import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as userApi from '../api/userApi';
import AdminLayout from '../components/layout/AdminLayout';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { STATUS } from '../constants/status';

const ITS_REGEX = /^\d{8}$/;

// Update is a genuine navigation - its whole purpose is to take you to the
// existing Edit page (same form, same field permissions). The other three
// stay on this page: perform the action, then show a closable success
// message and reset the search, ready for the next ITS - no redirect to
// the Users table.
const ACTION_CONFIG = {
  update: {
    title: 'Update User',
    buttonLabel: 'Edit User',
    run: async (user, navigate) => navigate(`/users/${user._id}/edit`),
  },
  'mark-active': {
    title: 'Mark User Active',
    buttonLabel: 'Mark Active',
    confirm: (u) => `Mark ${u.name} active?`,
    run: async (user) => userApi.markUserActive(user._id),
    successMessage: (u) => `${u.name} marked active.`,
  },
  delete: {
    title: 'Delete User',
    buttonLabel: 'Delete',
    variant: 'danger',
    confirm: (u) => `Delete ${u.name}? This cannot be undone from this screen.`,
    run: async (user) => userApi.deleteUser(user._id),
    successMessage: (u) => `${u.name} deleted.`,
  },
  'mark-inactive': {
    title: 'Mark User Inactive',
    buttonLabel: 'Mark Inactive',
    confirm: (u) => `Mark ${u.name} inactive?`,
    run: async (user) => userApi.markUserInactive(user._id),
    successMessage: (u) => `${u.name} marked inactive.`,
  },
};

// `action` is a prop (set per-route in App.jsx), not a URL param - the 4
// sidebar routes are separate literal paths (each with its own RoleRoute
// gate matching the backend's exact permissions), not one dynamic segment.
export default function FindUserActionPage({ action }) {
  const config = ACTION_CONFIG[action];
  const navigate = useNavigate();

  const [its, setIts] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searching, setSearching] = useState(false);
  const [acting, setActing] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFoundUser(null);

    if (!ITS_REGEX.test(its)) {
      setError('ITS must be exactly 8 digits');
      return;
    }

    setSearching(true);
    try {
      const user = await userApi.getUserByIts(its);
      setFoundUser(user);
    } catch (err) {
      setError(err.message || 'User not found');
    } finally {
      setSearching(false);
    }
  };

  const handleAction = async () => {
    if (config.confirm && !window.confirm(config.confirm(foundUser))) return;

    setError('');
    setActing(true);
    try {
      const message = config.successMessage?.(foundUser);
      await config.run(foundUser, navigate);
      // Update navigates away - nothing left to do on this page. The other
      // three stay here: show the success message and reset the search.
      if (message) {
        setSuccess(message);
        setFoundUser(null);
        setIts('');
        setActing(false);
      }
    } catch (err) {
      setError(err.message || 'Action failed');
      setActing(false);
    }
  };

  return (
    <AdminLayout title={config.title} maxWidth="max-w-md">
      <Alert tone="danger" onClose={() => setError('')}>
        {error}
      </Alert>
      <Alert tone="success" onClose={() => setSuccess('')}>
        {success}
      </Alert>

      <form onSubmit={handleSearch} className="flex flex-col gap-4" noValidate>
        <FormField
          id="its"
          label="ITS"
          inputMode="numeric"
          placeholder="12345678"
          value={its}
          onChange={(e) => {
            setIts(e.target.value.replace(/\D/g, '').slice(0, 8));
            setFoundUser(null);
            setSuccess('');
          }}
        />
        <Button type="submit" loading={searching}>
          Find User
        </Button>
      </form>

      {foundUser && (
        <div className="mt-6 rounded-card border border-border bg-surface p-5">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Name</dt>
              <dd className="text-text">{foundUser.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Email</dt>
              <dd className="text-text">{foundUser.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Role</dt>
              <dd>
                <Badge tone="primary">{foundUser.role}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Status</dt>
              <dd>
                <Badge tone={foundUser.status === STATUS.ACTIVE ? 'success' : 'gray'}>
                  {foundUser.status === STATUS.ACTIVE ? 'Active' : 'Inactive'}
                </Badge>
              </dd>
            </div>
          </dl>
          <Button
            className="mt-5"
            variant={config.variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleAction}
            loading={acting}
          >
            {config.buttonLabel}
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
