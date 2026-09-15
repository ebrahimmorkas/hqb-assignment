const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLE_VALUES, ROLES } = require('../constants/roles');
const { STATUS, STATUS_VALUES } = require('../constants/status');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{7,15}$/;
const ITS_REGEX = /^\d{8}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      // Intentionally NOT unique - multiple users are allowed to share an
      // email address in this system. ITS is the unique identifier.
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => EMAIL_REGEX.test(value),
        message: 'Email must be a valid email address',
      },
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      // sparse so documents that omit phone entirely aren't indexed - only
      // an actually-provided value has to be unique. No `default`: setting
      // one would store an explicit null on every doc, which a sparse index
      // still indexes (sparse skips missing fields, not null ones), and
      // every user would collide on that null.
      unique: true,
      sparse: true,
      validate: {
        validator: (value) => value == null || PHONE_REGEX.test(value),
        message: 'Phone must contain only digits (7-15 digits)',
      },
    },
    its: {
      type: String,
      required: [true, 'ITS is required'],
      // Uniqueness is enforced below via a partial index (only among
      // non-deleted users), not here - a plain `unique: true` would keep a
      // deleted user's ITS permanently reserved forever.
      trim: true,
      validate: {
        validator: (value) => ITS_REGEX.test(value),
        message: 'ITS must be exactly 8 digits',
      },
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age must be a realistic value'],
      validate: {
        validator: Number.isInteger,
        message: 'Age must be a whole number',
      },
    },
    watan: {
      type: String,
      required: [true, 'Watan is required'],
      trim: true,
      // Kept as a plain string (not a WatanMaster ObjectId ref) so the table
      // and this schema don't need a populate() on every read - validated
      // against the master list instead, so only a value that exists there
      // can ever be stored.
      validate: {
        validator: async function isKnownWatan(value) {
          const WatanMaster = mongoose.model('WatanMaster');
          return Boolean(await WatanMaster.exists({ name: value }));
        },
        message: 'Watan must be a valid selection from the watan master list',
      },
    },
    role: {
      type: String,
      enum: { values: ROLE_VALUES, message: 'Role must be one of: ' + ROLE_VALUES.join(', ') },
      default: ROLES.USER,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    // Bumped to invalidate every refresh token issued before the bump (logout,
    // password change). The refresh JWT carries the version it was issued
    // with; authService.refresh() rejects a token whose version is stale.
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    status: {
      type: String,
      enum: { values: STATUS_VALUES, message: 'Status must be one of: ' + STATUS_VALUES.join(', ') },
      default: STATUS.ACTIVE,
    },
    // One entry per status change (not exposed by default - see select:
    // false). Who did it and when, for every A/I/D transition.
    statusAudit: {
      type: [
        {
          _id: false,
          status: { type: String, enum: STATUS_VALUES, required: true },
          changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
  },
  { timestamps: true }
);

// Partial unique index: ITS only has to be unique among users that aren't
// soft-deleted, so once a user is deleted their ITS becomes available for a
// brand new account to reuse.
userSchema.index(
  { its: 1 },
  // MongoDB partial-index filters don't support $ne/$not - list the
  // non-deleted statuses instead of excluding the deleted one.
  { unique: true, partialFilterExpression: { status: { $in: [STATUS.ACTIVE, STATUS.INACTIVE] } } }
);

userSchema.pre('save', async function hashPassword() {
  try {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
  } catch (err) {
    throw err;
  }
});

module.exports = mongoose.model('User', userSchema);
