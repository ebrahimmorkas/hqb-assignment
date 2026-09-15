const express = require('express');
const watanController = require('../controllers/watanController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Reference data (hometown list for the dropdown) - not sensitive, so any
// authenticated user can read it rather than restricting to super-admin.
router.get('/', protect, watanController.getAllWatans);

module.exports = router;
