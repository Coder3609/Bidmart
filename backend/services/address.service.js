const addressModel = require('../models/address.model');
const { ApiError } = require('../utils/apiResponse');

function isNonEmpty(str, max = 190) {
  return typeof str === 'string' && str.trim().length > 0 && str.trim().length <= max;
}

async function listAddresses(userId) {
  return addressModel.findByUser(userId);
}

async function createAddress(userId, input) {
  const { label, fullName, phone, line1, line2, city, state, postalCode, country } = input;

  if (!isNonEmpty(fullName) || !isNonEmpty(phone, 20) || !isNonEmpty(line1) ||
      !isNonEmpty(city, 100) || !isNonEmpty(state, 100) || !isNonEmpty(postalCode, 20)) {
    throw new ApiError('Full name, phone, address line, city, state, and postal code are required.', 400, 'INVALID_ADDRESS');
  }

  const existingCount = await addressModel.countByUser(userId);
  const isDefault = existingCount === 0; // first address for a user becomes the default automatically

  return addressModel.create({
    userId, label, fullName: fullName.trim(), phone: phone.trim(), line1: line1.trim(),
    line2, city: city.trim(), state: state.trim(), postalCode: postalCode.trim(), country, isDefault,
  });
}

async function deleteAddress(userId, addressId) {
  const address = await addressModel.findById(addressId);
  if (!address || address.user_id !== userId) {
    throw new ApiError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
  }
  await addressModel.remove(addressId);
}

module.exports = { listAddresses, createAddress, deleteAddress };
