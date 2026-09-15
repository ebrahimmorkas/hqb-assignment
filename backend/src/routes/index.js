const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const watanRoutes = require('./watanRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/watans', watanRoutes);

module.exports = router;
