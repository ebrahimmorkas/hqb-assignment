import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as userApi from '../api/userApi';
import { SELF_EDIT_FIELDS } from '../constants/userFormFields';
import AuthLayout from '../components/layout/AuthLayout';
import UserForm from '../components/users/UserForm';
import Alert from '../components/ui/Alert';

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState('');

  const handleSubmit = async (data) => {
    await userApi.updateUser(user._id, data);
    await refreshUser();
    setSuccess('Profile updated successfully.');
  };

  return (
    <AuthLayout title="Edit Profile">
      <Alert tone="success" onClose={() => setSuccess('')}>
        {success}
      </Alert>

      <UserForm
        fields={SELF_EDIT_FIELDS}
        initialValues={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
        submitLabel="Save changes"
      />
    </AuthLayout>
  );
}
