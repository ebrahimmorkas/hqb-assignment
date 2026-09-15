import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import Profile from './Profile';
import UsersPage from './UsersPage';

// Landing route after login - which view renders depends entirely on role.
export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
    return <UsersPage />;
  }

  return <Profile />;
}
