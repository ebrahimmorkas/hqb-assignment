const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Listing every user is an admin/super-admin action - it's what feeds the
// user management table.
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getAllUsers);
// Sidebar "find by ITS" flow (Update/Mark Active/Delete/Mark Inactive all
// start here). Declared before /:id - different segment count, so no actual
// routing ambiguity, but keeping the more specific path first is clearer.
router.get('/its/:its', protect, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getUserByIts);
// Only reached by the Edit User page (admin/super-admin) now that create/edit
// are dedicated pages, not modals - was previously wide open with no auth at
// all, tightened to match the same row-visibility rule getAllUsers uses.
router.get('/:id', protect, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), userController.getUserById);
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

// Status transitions - route-level authorize() only narrows to "admin or
// super-admin can even attempt this"; the fine-grained rule (admin acts on
// role:user targets, super-admin bypasses onto role:admin targets) lives in
// userService.js's TRANSITIONS table, since it depends on the target row's
// role too, not just the actor's.
router.patch(
  '/:id/mark-inactive',
  protect,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
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
