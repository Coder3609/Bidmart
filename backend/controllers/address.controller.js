const addressService = require('../services/address.service');
const { success } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const addresses = await addressService.listAddresses(req.user.id);
    return success(res, addresses, 'Addresses fetched.');
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const address = await addressService.createAddress(req.user.id, req.body);
    return success(res, address, 'Address saved.', 201);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await addressService.deleteAddress(req.user.id, req.params.id);
    return success(res, null, 'Address deleted.');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove };
