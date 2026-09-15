// Single source of truth for user status - referenced by the User model's
// enum and by the status-transition endpoints/permission checks.
const STATUS = Object.freeze({
  ACTIVE: 'A',
  INACTIVE: 'I',
  DELETED: 'D',
});

const STATUS_VALUES = Object.values(STATUS);

module.exports = { STATUS, STATUS_VALUES };
