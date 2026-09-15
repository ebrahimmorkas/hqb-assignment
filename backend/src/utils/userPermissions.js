const { ROLES } = require('../constants/roles');

// Whether an actor with `actorRole` is allowed to manage `target` (a user
// document/row) at all - admin manages plain users, super-admin manages
// users and admins but never a fellow super-admin (including themselves,
// since their own row is necessarily role: super-admin too). One rule,
// shared by the users-list row filter, the status-change endpoints, and the
// edit endpoint, so the three can never drift apart.
function canManage(actorRole, target) {
  if (actorRole === ROLES.ADMIN) return target.role === ROLES.USER;
  if (actorRole === ROLES.SUPER_ADMIN) return target.role !== ROLES.SUPER_ADMIN;
  return false;
}

module.exports = { canManage };
