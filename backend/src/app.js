const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const config = require('./config/env');
const logger = require('./utils/logger');
const normalizeError = require('./utils/normalizeError');
const requestLogger = require('./middlewares/requestLogger');

const app = express();

// credentials:true + an explicit origin (never '*') are both required for
// the browser to send/accept the httpOnly auth cookies cross-origin.
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler - last resort for errors that never reached a
// controller's own try/catch (e.g. thrown synchronously in middleware).
app.use((err, req, res, next) => {
  logger.logException('Unhandled request error', { err });
  const { statusCode, message } = normalizeError(err);
  res.status(statusCode).json({ success: false, message });
});

module.exports = app;
