import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import {
  EditIcon,
  PlayCircleIcon,
  TrashIcon,
  PauseCircleIcon,
  PlusIcon,
  UsersIcon,
} from '../components/ui/icons';

// One definition, shared by every admin/super-admin page (via AdminLayout) -
// matches the backend's TRANSITIONS table exactly: admin only ever
// deactivates a plain user; super-admin creates, updates, reactivates, or
// deletes (the admin-role bypass on mark-inactive only shows up as a
// per-row table action, not here, since that's not a distinct "module").
// "All Users" (the table/landing page) comes first for both roles - it's
// the only way back to it once you're on Create/Edit/Find, other than
// Cancel/Save inside those forms.
const SIDEBAR_ITEMS = {
  [ROLES.SUPER_ADMIN]: [
    { key: 'all-users', label: 'All Users', path: '/', icon: UsersIcon },
    { key: 'create', label: 'Create User', path: '/users/new', icon: PlusIcon },
    { key: 'update', label: 'Update User', path: '/users/find/update', icon: EditIcon },
    { key: 'mark-active', label: 'Mark Active', path: '/users/find/mark-active', icon: PlayCircleIcon },
    { key: 'delete', label: 'Delete User', path: '/users/find/delete', icon: TrashIcon },
  ],
  [ROLES.ADMIN]: [
    { key: 'all-users', label: 'All Users', path: '/', icon: UsersIcon },
    { key: 'update', label: 'Update User', path: '/users/find/update', icon: EditIcon },
    { key: 'mark-inactive', label: 'Mark Inactive', path: '/users/find/mark-inactive', icon: PauseCircleIcon },
  ],
};

export function useSidebarItems() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Just navigates - the sidebar's own open/closed state is independent
  // (SidebarContext) and must NOT change just because a link was clicked.
  return (SIDEBAR_ITEMS[user?.role] || []).map((item) => ({
    ...item,
    onClick: () => navigate(item.path),
  }));
}
