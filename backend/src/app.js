const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const logger = require('./utils/logger');
const requestLogger = require('./middlewares/requestLogger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  logger.logException('Unhandled request error', { err });
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
