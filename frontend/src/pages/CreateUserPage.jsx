import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as userApi from '../api/userApi';
import { useWatanOptions } from '../hooks/useWatanOptions';
import { CREATE_FIELDS } from '../constants/userFormFields';
import AdminLayout from '../components/layout/AdminLayout';
import UserForm from '../components/users/UserForm';
import Alert from '../components/ui/Alert';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const watanOptions = useWatanOptions(true); // only super-admin ever reaches this page
  const [success, setSuccess] = useState('');
  // Bumped on every successful create to remount UserForm - the cleanest
  // way to clear its fields for the next entry, since it owns its own
  // internal field state.
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (data) => {
    await userApi.createUser(data);
    setSuccess(`${data.name} created successfully.`);
    setFormKey((k) => k + 1);
  };

  return (
    <AdminLayout title="Create User" maxWidth="max-w-md">
      <Alert tone="success" onClose={() => setSuccess('')}>
        {success}
      </Alert>

      <UserForm
        key={formKey}
        fields={CREATE_FIELDS}
        watanOptions={watanOptions}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
        submitLabel="Create"
      />
    </AdminLayout>
  );
}
