import { useNavigate } from 'react-router-dom';
import * as userApi from '../api/userApi';
import { useWatanOptions } from '../hooks/useWatanOptions';
import { CREATE_FIELDS } from '../constants/userFormFields';
import Navbar from '../components/layout/Navbar';
import UserForm from '../components/users/UserForm';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const watanOptions = useWatanOptions(true); // only super-admin ever reaches this page

  const handleSubmit = async (data) => {
    await userApi.createUser(data);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-text">Create User</h1>
        <UserForm
          fields={CREATE_FIELDS}
          watanOptions={watanOptions}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/')}
          submitLabel="Create"
        />
      </div>
    </div>
  );
}
