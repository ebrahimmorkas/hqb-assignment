import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as userApi from '../api/userApi';
import { useWatanOptions } from '../hooks/useWatanOptions';
import { EDIT_FIELDS } from '../constants/userFormFields';
import { ROLES } from '../constants/roles';
import Navbar from '../components/layout/Navbar';
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

  useEffect(() => {
    userApi
      .getUserById(id)
      .then(setTargetUser)
      .catch((err) => setError(err.message || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data) => {
    await userApi.updateUser(id, data);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-text">
          {targetUser ? `Edit ${targetUser.name}` : 'Edit User'}
        </h1>

        <Alert>{error}</Alert>

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
      </div>
    </div>
  );
}
