const express = require('express');
const addressController = require('../controllers/address.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', addressController.list);
router.post('/', addressController.create);
router.delete('/:id', addressController.remove);

module.exports = router;
