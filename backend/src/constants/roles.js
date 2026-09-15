// Single source of truth for roles - referenced by the User model's enum
// and, later, by auth/role-guard middleware. Change roles here only.
const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
});

const ROLE_VALUES = Object.values(ROLES);

module.exports = { ROLES, ROLE_VALUES };
