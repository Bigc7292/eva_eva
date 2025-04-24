const express = require('express');
const router = express.Router();

/**
 * Health check endpoint for the backend service
 * Used by Docker healthcheck and monitoring systems
 */
router.get('/', (req, res) => {
  try {
    res.json({
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

module.exports = router;
