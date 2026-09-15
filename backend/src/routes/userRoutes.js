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
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
