const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Listing every user is an admin/super-admin action - it's what feeds the
// user management table.
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', protect, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.updateUser);

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
