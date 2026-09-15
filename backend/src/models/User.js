const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLE_VALUES, ROLES } = require('../constants/roles');

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
      unique: true,
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
  },
  { timestamps: true }
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
