import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as userApi from '../api/userApi';
import { SELF_EDIT_FIELDS } from '../constants/userFormFields';
import AuthLayout from '../components/layout/AuthLayout';
import UserForm from '../components/users/UserForm';

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    await userApi.updateUser(user._id, data);
    await refreshUser();
    navigate('/');
  };

  return (
    <AuthLayout title="Edit Profile">
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
