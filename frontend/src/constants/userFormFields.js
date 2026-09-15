import { ROLES } from './roles';

// What each actor role may edit on someone else's row - mirrors the
// backend's editableFieldsFor() exactly, so the fields shown are always a
// subset of what the server will actually accept.
export const EDIT_FIELDS = {
  [ROLES.ADMIN]: ['name', 'email', 'phone', 'age'],
  [ROLES.SUPER_ADMIN]: ['name', 'email', 'phone', 'age', 'its', 'watan'],
};

// Self-edit (a user editing their own profile) - same as admin's set, minus
// Name, which isn't self-editable.
export const SELF_EDIT_FIELDS = ['email', 'phone', 'age'];

export const CREATE_FIELDS = ['name', 'email', 'phone', 'its', 'age', 'watan', 'role', 'password'];
