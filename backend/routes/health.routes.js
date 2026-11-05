const express = require('express');
const { checkConnection } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const router = express.Router();

/**
 * GET /api/health
 * Confirms the API is running and can reach the MySQL database.
 */
router.get('/', async (req, res) => {
  try {
    await checkConnection();
    return success(res, {
      api: 'up',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }, 'Marketplace API is healthy');
  } catch (err) {
    return error(res, `Database connection failed: ${err.message}`, 503, 'DB_UNAVAILABLE');
  }
});

module.exports = router;
