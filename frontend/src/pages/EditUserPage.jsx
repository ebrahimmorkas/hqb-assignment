import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as userApi from '../api/userApi';
import { useWatanOptions } from '../hooks/useWatanOptions';
import { EDIT_FIELDS } from '../constants/userFormFields';
import { ROLES } from '../constants/roles';
import AdminLayout from '../components/layout/AdminLayout';
import UserForm from '../components/users/UserForm';
import Alert from '../components/ui/Alert';

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const watanOptions = useWatanOptions(user?.role === ROLES.SUPER_ADMIN);

  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    userApi
      .getUserById(id)
      .then(setTargetUser)
      .catch((err) => setError(err.message || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data) => {
    const updated = await userApi.updateUser(id, data);
    setTargetUser(updated);
    setSuccess('Changes saved successfully.');
  };

  return (
    <AdminLayout title={targetUser ? `Edit ${targetUser.name}` : 'Edit User'} maxWidth="max-w-md">
      <Alert tone="danger" onClose={() => setError('')}>
        {error}
      </Alert>
      <Alert tone="success" onClose={() => setSuccess('')}>
        {success}
      </Alert>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        targetUser && (
          <UserForm
            fields={EDIT_FIELDS[user.role]}
            initialValues={targetUser}
            watanOptions={watanOptions}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/')}
            submitLabel="Save changes"
          />
        )
      )}
    </AdminLayout>
  );
}
