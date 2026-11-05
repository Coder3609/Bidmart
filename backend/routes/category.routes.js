const express = require('express');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

// GET /api/categories - public
router.get('/', categoryController.list);

module.exports = router;
