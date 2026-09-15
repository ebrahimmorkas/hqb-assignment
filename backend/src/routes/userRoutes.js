const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Listing every user is an admin/super-admin action - it's what feeds the
// user management table.
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getAllUsers);
router.get('/:id', userController.getUserById);
// Only super-admin creates users - the form also blocks role: super-admin
// itself (see userService.createUser), so this can't spawn a peer either.
router.post('/', protect, authorize(ROLES.SUPER_ADMIN), userController.createUser);
// All three roles can reach this - a plain 'user' can only ever pass
// canEdit() for their own row (see userService.updateUser / canEdit), so
// this is really "self-edit, or manage a row you're allowed to manage".
router.put(
  '/:id',
  protect,
  authorize(ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.updateUser
);

// Status transitions - each restricted to the one role that owns that
// action (see userService.js's TRANSITIONS table for the full state
// machine: who, from what status, to what status).
router.patch(
  '/:id/mark-inactive',
  protect,
  authorize(ROLES.ADMIN),
  userController.markInactive
);
router.patch(
  '/:id/mark-active',
  protect,
  authorize(ROLES.SUPER_ADMIN),
  userController.markActive
);
router.delete('/:id', protect, authorize(ROLES.SUPER_ADMIN), userController.deleteUser);

module.exports = router;
