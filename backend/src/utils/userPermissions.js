const { ROLES } = require('../constants/roles');

// Whether an actor with `actorRole` is allowed to manage `target` (a user
// document/row) at all - admin manages plain users, super-admin manages
// users and admins but never a fellow super-admin (including themselves,
// since their own row is necessarily role: super-admin too). Shared by the
// users-list row filter and the status-change endpoints, so the two can
// never drift apart.
function canManage(actorRole, target) {
  if (actorRole === ROLES.ADMIN) return target.role === ROLES.USER;
  if (actorRole === ROLES.SUPER_ADMIN) return target.role !== ROLES.SUPER_ADMIN;
  return false;
}

// Edit permission is canManage() plus one extra case: anyone may always
// edit their own record (which fields they can touch is still limited
// separately by editableFieldsFor()). A plain 'user' has no canManage rows
// at all, so this self-case is the only way they can ever reach the update
// endpoint - editing themselves.
function canEdit(actorRole, actorId, target) {
  if (String(target._id) === String(actorId)) return true;
  return canManage(actorRole, target);
}

// Which User fields an actor may set via the edit endpoint. Admin gets
// Name/Email/Phone/Age; super-admin gets ITS and Watan on top of that; a
// plain user editing themselves gets the same base minus Name - Name is
// not self-editable.
function editableFieldsFor(actorRole) {
  if (actorRole === ROLES.SUPER_ADMIN) return ['name', 'email', 'phone', 'age', 'its', 'watan'];
  if (actorRole === ROLES.ADMIN) return ['name', 'email', 'phone', 'age'];
  return ['email', 'phone', 'age'];
}

module.exports = { canManage, canEdit, editableFieldsFor };
